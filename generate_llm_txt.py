"""
Generate vintrace-api-v7-llm.txt from the OpenAPI YAML.
"""
import re
import json

INPUT = "vintrace-api-v7-combined.yaml"
OUTPUT = "vintrace-api-v7-llm.txt"

with open(INPUT, encoding="utf-8") as f:
    content = f.read()


# ---- helpers ----
def get_summary(method_body):
    m = re.search(r"^\s*summary:\s*\"?(.*?)\"?\s*$", method_body, re.MULTILINE)
    return m.group(1).strip() if m else ""


def get_params(method_body):
    # Find the parameters: section, then scan until next major section
    params_start = method_body.find("parameters:")
    if params_start == -1:
        return []

    # Find the end of the params block by looking for next section at same indent
    # Sections at same indent: responses:, requestBody:, summary:, description:
    end_markers = ["\n      responses:", "\n      requestBody:", "\n    summary:", 
                   "\n      operationId:", "\n    get:", "\n    post:", "\n    put:",
                   "\n    patch:", "\n    delete:", "\n    parameters:"]
    params_end = len(method_body)
    for marker in end_markers:
        pos = method_body.find(marker, params_start + 1)
        if pos != -1 and pos < params_end:
            params_end = pos
    
    params_block = method_body[params_start:params_end]

    params = []
    for m in re.finditer(
        r"^\s+-\s+(?:name:\s+(\w+)|\$ref:\s*['\"]?(?:.+?/)?(?:components/parameters/)?(\w+)['\"]?)",
        params_block,
        re.MULTILINE,
    ):
        name = m.group(1) or m.group(2)
        if name and name != "common":
            params.append(name)
    return list(dict.fromkeys(params))


def get_req_schema(method_body):
    m = re.search(
        r"requestBody:.*?\n\s+content:\n\s+application/json:\n\s+schema:\n\s+\$ref:\s*['\"]#/components/schemas/(\S+)['\"]",
        method_body,
        re.DOTALL,
    )
    return m.group(1) if m else None


def get_resp_schema(method_body):
    m = re.search(
        r'"20[01]":\n.+?schema:\n\s+\$ref:\s*[\'\"]#/components/schemas/(\S+)[\'\"]',
        method_body,
        re.DOTALL,
    )
    if m:
        return m.group(1)
    if re.search(r'"204":', method_body):
        return "204-NoContent"
    return None


# ---- extract path -> methods ----
path_re = re.compile(
    r"^  (/wrw/api/v7/\S+):\n((?:\s{4,}(?!  /wrw/api/v7/).+\n*)*)",
    re.MULTILINE,
)

paths = {}
path_params = {}

for pm in path_re.finditer(content):
    path = pm.group(1)
    block = pm.group(2)
    methods = {}

    pp_match = re.search(r"^\s{4}parameters:\n((?:\s{6}-\s.+\n*)+)", block, re.MULTILINE)
    if pp_match:
        path_params[path] = get_params(pp_match.group(1))

    for mm in re.finditer(
        r"^\s{4}(get|post|put|patch|delete):\n((?:\s{6,}.+\n?)*)",
        block,
        re.MULTILINE,
    ):
        method = mm.group(1).upper()
        body = mm.group(2)

        cut_marks = [
            i
            for i in [
                body.find("\n    get:"),
                body.find("\n    post:"),
                body.find("\n    put:"),
                body.find("\n    patch:"),
                body.find("\n    delete:"),
                body.find("\n    parameters:"),
            ]
            if i >= 0
        ]
        if cut_marks:
            body = body[: min(cut_marks)]

        methods[method] = {
            "summary": get_summary(body),
            "params": get_params(body),
            "req": get_req_schema(body),
            "resp": get_resp_schema(body),
        }

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

SCHEMA_FLAGS = {"type: object", "allOf:", "properties:"}
YAML_KEYS = {
    "type", "format", "description", "example", "examples", "items",
    "allOf", "oneOf", "anyOf", "$ref", "required", "enum", "default",
    "nullable", "properties", "additionalProperties", "minLength",
    "maxLength", "minimum", "maximum", "pattern", "minItems", "maxItems",
    "uniqueItems", "readOnly", "writeOnly", "deprecated", "not",
}

schemas = {}
lines = schema_section.split("\n")

# State machine approach
# States: "seek_name" -> "in_schema" -> "in_props" -> "done"
# State transitions:
#   seek_name + indent4 name: -> in_schema (record name, start looking for properties)
#   in_schema + indent6 type:/allOf:/properties: -> in_props (or stay in_schema)
#   in_props + indent8 word: -> collect name
#   any state + indent4 name: -> new schema (finish previous)
#   in_props + indent6 word: -> back to in_schema (properties section ended)

state = "seek_name"
current_name = None
prop_names = []

for i, line in enumerate(lines):
    stripped = line.strip()
    if not stripped:
        continue

    # Detect lines by indent level
    indent = len(line) - len(line.lstrip())
    
    if indent == 4 and re.match(r"^\s{4}(\w+):\s*$", line):
        # Possible schema name (4-space indent, word+colon, nothing after)
        word = stripped[:-1]  # remove colon
        
        # Skip known non-name patterns
        if word in YAML_KEYS:
            # In schema context, these are internals
            if state == "in_schema":
                state = "in_schema"
            continue
        
        # Save previous schema
        if current_name and prop_names:
            schemas[current_name] = list(prop_names)
        
        # Start new potential schema
        current_name = word
        prop_names = []
        state = "in_schema"
        continue
    
    if indent == 6 and state == "in_schema":
        word = stripped.split(":")[0].strip()
        if word in {"properties", "allOf", "type"}:
            state = "in_schema"
        if word == "properties":
            state = "in_props"
        continue
    
    if indent == 8 and state == "in_props":
        word = stripped.split(":")[0].strip()
        if word not in YAML_KEYS and not word.startswith("$"):
            prop_names.append(word)
        continue
    
    if indent == 6 and state == "in_props":
        # End of properties section
        state = "in_schema"
        continue

# Save last schema
if current_name and prop_names:
    schemas[current_name] = prop_names


# ---- extract request body schemas that weren't detected ----
# Some schemas might not be in the components/schemas section
# Let's also extract from inline schemas in requestBodies/parameters
all_ref_schemas = set()
for path_data in paths.values():
    for info in path_data.values():
        if info["req"]:
            all_ref_schemas.add(info["req"])
        if info["resp"] and info["resp"] != "204-NoContent":
            all_ref_schemas.add(info["resp"])

# ---- Domain grouping ----
DOMAINS = {
    "harvest": "Harvest",
    "identity": "Identity",
    "operation": "Operation",
    "stock": "Stock",
    "account": "Account",
    "costs": "Costs",
    "report": "Report",
    "vessel": "Vessel",
}
ORDER = list(DOMAINS.keys())

grouped = {d: {} for d in ORDER}
for path in sorted(paths):
    rest = path.replace("/wrw/api/v7/", "")
    domain = rest.split("/")[0]
    if domain in grouped:
        grouped[domain][path] = paths[path]


# ---- output ----
L = []


def add(*args):
    L.extend(args)


add(
    "# Vintrace API v7 Reference",
    "",
    "> AI-friendly API reference derived from the OpenAPI 3.0.3 spec.",
    "> Concise and complete for LLM consumption.",
    "",
    "## Servers & Auth",
    "",
    "All paths relative to `<base>/wrw/api/v7/`.",
    "",
    "- **Production**: `https://oz50.vintrace.net`",
    "- **Sandbox**: `https://sandbox.vintrace.net`",
    "- **Auth**: Bearer token (`Authorization: Bearer <token>`)",
    "- **Correlation ID**: Every request/response uses `correlation-id` header (UUID)",
    "- **Dates**: epoch milliseconds (int64)",
    "",
    "## Response & Parameter Conventions",
    "",
    "### Paginated List (GET /collection)",
    "```json",
    '{ "totalResults": 120, "offset": 0, "limit": 10,',
    '  "first": "...", "previous": null, "next": "...", "last": "...",',
    '  "results": [...] }',
    "```",
    "",
    "### Single Resource (GET /resource/{id})",
    "```json",
    '{ "data": { ... } }',
    "```",
    "",
    "### Error (DefaultError)",
    "```json",
    '{ "correlationId": "uuid", "status": 400,',
    '  "code": "...", "message": "...", "details": [...] }',
    "```",
    "",
    "### Common Parameters (on most endpoints)",
    "",
    "| Parameter | Location | Type | Description |",
    "|---|---|---|---|",
    "| `CorrelationId` | header | string (uuid) | Request tracing ID |",
    "| `PaginationLimit` | query | integer | Page size (default varies) |",
    "| `PaginationOffset` | query | integer | Record offset for pagination |",
    "| `ModifiedSince` | query | int64 (epoch ms) | Filter modified >= timestamp |",
    "| `ModifiedBefore` | query | int64 (epoch ms) | Filter modified < timestamp |",
    "| `BusinessUnit` | query | string | Filter by business unit code |",
    "| `WineryName` | query | string | Filter by winery name |",
    "| `WineryId` | query | integer | Filter by winery ID |",
    "| `StartDate` | query | int64 (epoch ms) | Start of date range |",
    "| `EndDate` | query | int64 (epoch ms) | End of date range |",
    "| `ExtraFields` | query | string | Comma-separated field names to include |",
    "| `CreatedSince` | query | int64 (epoch ms) | Filter created >= |",
    "| `CreatedBefore` | query | int64 (epoch ms) | Filter created < |",
    "| `AssessedBy` | query | string | Filter by assessor name |",
    "| `VintraceEntityId` | path | integer | Entity identifier in URL |",
    "| `VintraceEntityIds` | query | string | CSV of entity IDs |",
    "| `OperationId` | path | integer | Operation ID |",
    "| `BlockId` | path | integer | Block ID |",
    "| `BookingId` | path | integer | Booking ID |",
    "| `FruitIntakeId` | path | integer | Fruit intake ID |",
    "| `ProductId` | path/query | integer | Product ID |",
    "| `VesselId` | path/query | integer | Vessel ID |",
    "| `VesselCode` | query | string | Vessel code filter |",
    "| `VesselType` | query | string | Vessel type filter |",
    "| `WineBatchCode` | query | string | Wine batch code filter |",
    "| `Owner` | query | string | Filter by owner |",
    "| `ReportDate` | query | int64 (epoch ms) | Report snapshot date |",
    "",
)

# Endpoints
add("## Endpoints", "")
add("> CorrelationId is on ALL endpoints — omitted from individual endpoint param lists.", "")
add("")

for domain in ORDER:
    if not grouped[domain]:
        continue
    add(f"### {DOMAINS[domain]}", "")

    for path, methods in grouped[domain].items():
        short = path.replace("/wrw/api/v7", "")
        pp = [p for p in path_params.get(path, []) if p != "CorrelationId"]

        for method in sorted(methods):
            info = methods[method]

            add(f"**{method}** `{short}`  ")
            if info["summary"]:
                add(f"  {info['summary']}")

            all_params = pp + [p for p in info["params"] if p != "CorrelationId"]
            if all_params:
                add(f"  _Params_: {', '.join(all_params)}")

            if info["req"]:
                schema = info["req"]
                add(f"  _Request_: `{schema}`")
                if schema in schemas:
                    props = schemas[schema]
                    add(f"    Fields: {', '.join(props[:15])}")
                    if len(props) > 15:
                        add(f"    (+{len(props)-15} more)")

            if info["resp"] and info["resp"] != "204-NoContent":
                schema = info["resp"]
                add(f"  _Response_: `{schema}`")
                if schema in schemas:
                    props = schemas[schema]
                    add(f"    Fields: {', '.join(props[:15])}")
                    if len(props) > 15:
                        add(f"    (+{len(props)-15} more)")
            elif info["resp"] == "204-NoContent":
                add("  _Response_: 204 (No Content)")

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
    # Try to extract types for each property
    s_pos = schema_section.find(f"\n    {sname}:\n")
    if s_pos > 0:
        block = schema_section[s_pos : s_pos + 20000]
        for p in props:
            # Find type for this property within the schema block
            ptype = "?"
            p_match = re.search(
                rf"^        {p}:\n((?:^\s{{10,}}.*\n)*?^\s{{10,}}type:\s*(\S+))",
                block,
                re.MULTILINE,
            )
            if p_match:
                ptype = p_match.group(2)
            else:
                # Check for allOf
                allof_match = re.search(
                    rf"^        {p}:\n.*allOf:",
                    block,
                    re.MULTILINE,
                )
                if allof_match:
                    ptype = "object"
                # Check for $ref
                ref_match = re.search(
                    rf"^        {p}:\n.*\$ref:",
                    block,
                    re.MULTILINE,
                )
                if ref_match:
                    ptype = "ref"
            add(f"- `{p}`: {ptype}")

    add("")

# Write
out = "\n".join(L)
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(out)

print(f"Generated {OUTPUT} — {len(out):,} bytes, {len(L)} lines")
print(f"Extracted {len(paths)} paths, {len(schemas)} schemas, {sum(len(v) for v in schemas.values())} total properties")
