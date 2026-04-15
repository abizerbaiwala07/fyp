import re

file_path = 'app/routes/auth.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for the redundant CORS code
pattern = r'    # Add CORS headers\n    origin = request\.headers\.get\("origin", "\*"\) if request else "\*"\n    json_response = JSONResponse\(content=response\.dict\(\)\)\n    return add_cors_headers\(json_response, origin\)'

# Replace with direct return
new_content = re.sub(pattern, '    return response', content)

# Check for other variations (like response_data instead of response)
pattern_data = r'    # Add CORS headers\n    origin = request\.headers\.get\("origin", "\*"\) if request else "\*"\n    json_response = JSONResponse\(content=response_data\.dict\(\) if hasattr\(response_data, "dict"\) else response_data\)\n    return add_cors_headers\(json_response, origin\)'

# Actually, let's just use a more generic regex for the whole block
# Matching from the comment till the add_cors_headers call
generic_pattern = r'    # Add CORS headers\n    origin = request\.headers\.get\("origin", \".*\"\).*\n    .*\n    return add_cors_headers\(.*, origin\)'

def replacement_func(match):
    # Find what's being returned. It's usually either 'response' or 'response_data'
    # The third line in the match usually looks like: json_response = JSONResponse(content=X.dict())
    lines = match.group(0).split('\n')
    third_line = lines[2]
    # Extract X from JSONResponse(content=X.dict()) or JSONResponse(content=X)
    match_var = re.search(r'content=([a-zA-Z0-9_]+)', third_line)
    if match_var:
        return f'    return {match_var.group(1)}'
    return '    return response' # Fallback

new_content = re.sub(generic_pattern, replacement_func, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced broken CORS blocks.")
