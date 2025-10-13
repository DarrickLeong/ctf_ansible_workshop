#!/usr/bin/env python3
"""
Simple envsubst replacement for template substitution
"""
import os
import sys
import re

def substitute_variables(content, env_vars):
    """Substitute environment variables in content"""
    # Pattern to match ${VAR} or $VAR format
    def replace_var(match):
        var_name = match.group(1)
        return env_vars.get(var_name, match.group(0))  # Return original if not found
    
    # Substitute ${VAR} format
    content = re.sub(r'\$\{(\w+)\}', replace_var, content)
    # Substitute $VAR format (word boundary)
    content = re.sub(r'\$(\w+)\b', replace_var, content)
    
    return content

def load_env_file(env_file):
    """Load environment variables from a file"""
    env_vars = {}
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print(f"Error: Environment file {env_file} not found")
        sys.exit(1)
    
    return env_vars

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 substitute_vars.py <template_file> <env_file> [output_file]")
        sys.exit(1)
    
    template_file = sys.argv[1]
    env_file = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Load environment variables
    env_vars = load_env_file(env_file)
    
    # Read template
    try:
        with open(template_file, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: Template file {template_file} not found")
        sys.exit(1)
    
    # Substitute variables
    result = substitute_variables(content, env_vars)
    
    # Output result
    if output_file:
        with open(output_file, 'w') as f:
            f.write(result)
        print(f"Template processed: {template_file} -> {output_file}")
    else:
        print(result)

if __name__ == "__main__":
    main()
