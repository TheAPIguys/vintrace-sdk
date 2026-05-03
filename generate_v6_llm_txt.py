"""
Generate vintrace-v6-llm.txt from the v6 OpenAPI YAML.
"""
import re

INPUT = "vintrace-v6-apis.yaml"
OUTPUT = "vintrace-v6-llm.txt"

with open(INPUT, encoding="utf-8") as f:
    content = f.read()

# Isolate just the paths section
paths_start = content.find("\npaths:\n")
paths_end = content.find("\ncomponents:\n", paths_start)
paths_section = content[paths_start:paths_end] if paths_end > paths_start else ""


# ---- helpers ----
def get_summary(method_body):
    m = re.search(r"summary: \"?(.*?)\"?\s*$", method_body, re.MULTILINE)
    return m.group(1).strip() if m else ""


def get_params(method_body):
    params_start = method_body.find("parameters:")
    if params_start == -1:
        return []

    end_markers = [
        "\n      responses:", "\n      requestBody:", "\n      summary:",
        "\n      operationId:", "\n      get:", "\n      post:", "\n      put:",
        "\n      patch:", "\n      delete:",
    ]
    params_end = len(method_body)
    for marker in end_markers:
        pos = method_body.find(marker, params_start + 1)
        if pos != -1 and pos < params_end:
            params_end = pos

    params_block = method_body[params_start:params_end]

    params = []
    for m in re.finditer(r"^\s+-\s+name:\s+(\w+)", params_block, re.MULTILINE):
        name = m.group(1)
        if name and name not in {"first", "max"}:
            params.append(name)
    return list(dict.fromkeys(params))


def get_req_schema(method_body):
    m = re.search(
        r"requestBody:.*?\$ref:\s*['\"]#/components/schemas/(\S+)['\"]",
        method_body,
        re.DOTALL,
    )
    return m.group(1) if m else None


def get_resp_schema(method_body):
    for q in ("'200':", '"200":'):
        m = re.search(
            q + r".*?\$ref:\s*['\"]#/components/schemas/(\S+)['\"]",
            method_body,
            re.DOTALL,
        )
        if m:
            return m.group(1)
    return None


# ---- extract paths with regex ----
# Match: 2-space indent, path (quoted or unquoted), colon
path_re = re.compile(
    r"^  '?(/[\w/\-{}%]+)'?:\s*\n((?:    .+\n?)*)",
    re.MULTILINE,
)

paths = {}

for pm in path_re.finditer(paths_section):
    path = pm.group(1)  # path without surrounding quotes
    block = pm.group(2)
    methods = {}

    # Find each HTTP method at 4-space indent within this path block
    for mm in re.finditer(
        r"^    (get|post|put|patch|delete):\n((?:      .+\n?)*)",
        block,
        re.MULTILINE,
    ):
        method = mm.group(1).upper()
        body = mm.group(2)

        # Cut at next method or end
        cut_positions = [
            body.find("\n      get:"),
            body.find("\n      post:"),
            body.find("\n      put:"),
            body.find("\n      patch:"),
            body.find("\n      delete:"),
        ]
        valid_cuts = [p for p in cut_positions if p >= 0]
        if valid_cuts:
            body = body[: min(valid_cuts)]

        methods[method] = {
            "summary": get_summary(body),
            "params": get_params(body),
            "req": get_req_schema(body),
            "resp": get_resp_schema(body),
        }

    if methods:
        paths[path] = methods


# ---- extract schemas ----
schema_start = content.find("\ncomponents:\n  schemas:\n")
schema_end = content.find("\n  parameters:", schema_start)
if schema_end == -1:
    schema_end = content.find("\n  responses:", schema_start)
if schema_end == -1:
    schema_end = content.find("\n  examples:", schema_start)
if schema_end == -1:
    schema_end = content.find("\n  securitySchemes:", schema_start)
if schema_end == -1:
    schema_end = len(content)

schema_section = content[schema_start:schema_end]

YAML_KEYS = {
    "type", "format", "description", "example", "examples", "items",
    "allOf", "oneOf", "anyOf", "$ref", "required", "enum", "default",
    "nullable", "properties", "additionalProperties", "minLength",
    "maxLength", "minimum", "maximum", "pattern", "minItems", "maxItems",
    "uniqueItems", "readOnly", "writeOnly", "deprecated", "not",
}

schemas = {}
schema_lines = schema_section.split("\n")
current_name = None
prop_names = []
state = "seek_name"

for line in schema_lines:
    stripped = line.strip()
    if not stripped:
        continue
    indent = len(line) - len(line.lstrip())

    if indent == 4 and re.match(r"^\s{4}(\w+):\s*$", line):
        word = stripped[:-1]
        if word in YAML_KEYS:
            continue
        if current_name and prop_names:
            schemas[current_name] = list(prop_names)
        current_name = word
        prop_names = []
        state = "in_schema"
        continue

    if indent == 6 and state == "in_schema":
        word = stripped.split(":")[0].strip()
        if word == "properties":
            state = "in_props"
        elif word in ("allOf", "type"):
            state = "in_schema"
        continue

    if indent == 8 and state == "in_props":
        word = stripped.split(":")[0].strip()
        if word not in YAML_KEYS and not word.startswith("$"):
            prop_names.append(word)
        continue

    if indent == 6 and state == "in_props":
        state = "in_schema"
        continue

if current_name and prop_names:
    schemas[current_name] = prop_names


# ---- group paths ----
TAGS = {
    "block-assessments": "Harvest",
    "intake-operations": "Operations",
    "sample-operations": "Operations",
    "transaction": "Operations",
    "workorders": "Work Orders",
    "sales-order": "Sales",
    "refund": "Sales",
    "party": "Identity",
    "products": "Products",
    "product-update": "Products",
    "stock": "Stock",
    "search": "Search",
    "inventory": "Stock",
    "mrp": "Stock",
}

grouped = {}
for path in sorted(paths):
    tag = path.strip("/").split("/")[0]
    domain = TAGS.get(tag, tag.title())
    if domain not in grouped:
        grouped[domain] = {}
    grouped[domain][path] = paths[path]


# ---- output ----
L = []


def add(*args):
    L.extend(args)


add(
    "# Vintrace API v6 Reference",
    "",
    "> AI-friendly API reference derived from the OpenAPI 3.0.3 spec.",
    "",
    "## Servers & Auth",
    "",
    "All paths relative to `<base>/vinx2/api/v6/`.",
    "",
    "- **Production**: `https://oz50.vintrace.net/vinx2/api/v6`",
    "- **Sandbox**: `https://sandbox.vintrace.net/vinx2demo/api/v6`",
    "- **Auth**: Cookie/session-based (login via vintrace web app).",
    "- **Headers**: `Accept: application/json`",
    "- **Dates**: `YYYY-MM-DD` strings, epoch millis in some fields.",
    "",
    "## Response Patterns",
    "",
    "### Paginated List (GET /collection)",
    "```json",
    '{ "firstResult": 0, "maxResult": 20, "totalResultCount": 200,',
    '  "nextURLPath": "...", "prevURLPath": "...", "results": [...] }',
    "```",
    "- Use `first` / `max` query params. `max` defaults to 20 (some endpoints: 100).",
    "",
    "### Single Resource (GET by ID/code)",
    "Returns the object directly (no envelope).",
    "",
    "### Write Response Envelope",
    "```json",
    '{ "status": "Success", "message": null, "<entity>": { ... } }',
    "```",
    "",
)

# Endpoints
add("## Endpoints", "")
add("> `first`/`max` omitted for brevity.", "")
add("")

for domain in sorted(grouped):
    add(f"### {domain}", "")

    for path, methods in grouped[domain].items():
        for method in sorted(methods):
            info = methods[method]

            add(f"**{method}** `{path}`  ")
            if info["summary"]:
                add(f"  {info['summary']}")

            if info["params"]:
                add(f"  _Params_: {', '.join(info['params'])}")

            if info["req"]:
                schema = info["req"]
                add(f"  _Request_: `{schema}`")
                if schema in schemas:
                    props = schemas[schema]
                    add(f"    Fields: {', '.join(props[:15])}")
                    if len(props) > 15:
                        add(f"    (+{len(props)-15} more)")

            if info["resp"]:
                schema = info["resp"]
                add(f"  _Response_: `{schema}`")
                if schema in schemas:
                    props = schemas[schema]
                    add(f"    Fields: {', '.join(props[:15])}")
                    if len(props) > 15:
                        add(f"    (+{len(props)-15} more)")

            add("")

# Key schemas
add("## Key Schemas", "")
add("Schemas with at least 3 properties:", "")
add("")

for sname in sorted(schemas.keys()):
    props = schemas[sname]
    if len(props) < 3:
        continue
    add(f"### {sname} ({len(props)} fields)", "")

    s_pos = schema_section.find(f"\n    {sname}:\n")
    if s_pos > 0:
        block = schema_section[s_pos: s_pos + 20000]
        for p in props:
            ptype = "?"
            p_match = re.search(
                rf"^        {p}:\n((?:^\s{{10,}}.*\n)*?^\s{{10,}}type:\s*(\S+))",
                block,
                re.MULTILINE,
            )
            if p_match:
                ptype = p_match.group(2)
            else:
                if re.search(rf"^        {p}:\n.*allOf:", block, re.MULTILINE):
                    ptype = "object"
                elif re.search(rf"^        {p}:\n.*\$ref:", block, re.MULTILINE):
                    ptype = "ref"
            add(f"- `{p}`: {ptype}")
    add("")

# Write
out = "\n".join(L)
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(out)

print(f"Generated {OUTPUT} — {len(out):,} bytes, {len(L)} lines")
print(f"Extracted {len(paths)} paths, {len(schemas)} schemas, {sum(len(v) for v in schemas.values())} props")
