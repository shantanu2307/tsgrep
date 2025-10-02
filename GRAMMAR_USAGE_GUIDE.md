# Grammar Usage Guide

This guide explains how to use the grammar for creating AST queries in tsgrep. The grammar defines a domain-specific language (DSL) for querying JavaScript/TypeScript Abstract Syntax Trees.

## Table of Contents

1. [Overview](#overview)
2. [Basic Syntax](#basic-syntax)
3. [Node Types](#node-types)
4. [Attributes](#attributes)
5. [Data Types](#data-types)
6. [Child Selectors](#child-selectors)
7. [Advanced Features](#advanced-features)
8. [Examples](#examples)
9. [Error Handling](#error-handling)

## Overview

The grammar parses query expressions that describe AST node patterns. These expressions are used to find specific code structures in JavaScript/TypeScript files. The grammar supports:

- Node type matching
- Attribute filtering
- Nested object properties
- Array matching
- Child relationship queries
- Regular expressions
- Multiple data types

## Basic Syntax

### Simple Node Type Query

```
TypeName
```

**Example:**

```
CallExpression
```

This matches any `CallExpression` node in the AST.

### Node Type with Attributes

```
TypeName[attribute=value]
```

**Example:**

```
Identifier[name="foo"]
```

This matches `Identifier` nodes where the `name` property equals "foo".

## Node Types

Node types correspond to JavaScript/TypeScript AST node types. Common types include:

- `CallExpression` - Function calls
- `Identifier` - Variable names
- `Literal` - String, number, boolean literals
- `FunctionDeclaration` - Function declarations
- `VariableDeclaration` - Variable declarations
- `MemberExpression` - Property access (obj.prop)
- `BinaryExpression` - Binary operations (a + b)
- `UnaryExpression` - Unary operations (!a)
- `ArrayExpression` - Array literals
- `ObjectExpression` - Object literals
- `BlockStatement` - Code blocks
- `ReturnStatement` - Return statements
- `IfStatement` - If statements
- `ForStatement` - For loops
- `WhileStatement` - While loops

## Attributes

Attributes allow you to filter nodes based on their properties. The syntax is:

```
[attribute=value]
```

### Simple Attributes

```
Identifier[name="myVariable"]
FunctionDeclaration[id.name="myFunction"]
```

### Nested Object Properties

Use dot notation to access nested properties:

```
MemberExpression[object.name="myObject"]
CallExpression[callee.name="console.log"]
```

### Multiple Attributes

Separate multiple attributes with commas:

```
FunctionDeclaration[id.name="myFunc", async="true"]
CallExpression[callee.name="log", arguments.length=2]
```

## Data Types

The grammar supports several data types for attribute values:

### Strings

Use single or double quotes:

```
Identifier[name="foo"]
Identifier[name='bar']
```

### Numbers

```
Literal[value="42"]
Literal[value=-"3.14"]
```

### Booleans

```
UnaryExpression[prefix="true"]
FunctionDeclaration[async="false"]
```

### Arrays

Arrays can contain any supported data type:

```
ArrayExpression[elements=["a", "b", "c"]]
CallExpression[arguments=[Identifier, Literal]]
```

### Regular Expressions

Strings that match the pattern `/pattern/flags` are converted to RegExp objects:

```
Identifier[name="/^my[A-Z]/"]
```

This creates a regex that matches identifiers starting with "my" followed by an uppercase letter.

## Child Selectors

Use the `>` operator to specify parent-child relationships:

### Single Level

```
BlockStatement > ReturnStatement
```

Matches `ReturnStatement` nodes that are direct children of `BlockStatement` nodes.

### Multiple Levels

```
Program > FunctionDeclaration > BlockStatement > ReturnStatement
```

Matches `ReturnStatement` nodes that are nested three levels deep within a `Program` node.

## Advanced Features

### Empty Selectors

You can match any node type with specific attributes by omitting the type name:

```
[async="true"]
```

This matches any node (regardless of type) that has `async="true"`.

### Complex Nested Structures

```
CallExpression[callee.name="log", arguments=[Literal[value="Hello"], Identifier[name="world"]]]
```

This matches console.log calls with specific arguments.

### Whitespace Handling

The grammar is whitespace-insensitive:

```
CallExpression [ async = "true" ]
```

Is equivalent to:

```
CallExpression[async="true"]
```

## Examples

### Finding Function Declarations

```bash
# Find all function declarations
FunctionDeclaration

# Find async functions
FunctionDeclaration[async="true"]

# Find functions with specific names
FunctionDeclaration[id.name="myFunction"]
```

### Finding Function Calls

```bash
# Find all function calls
CallExpression

# Find console.log calls
CallExpression[callee.name="log"]

# Find calls with specific number of arguments
CallExpression[arguments.length=2]
```

### Finding Variable Declarations

```bash
# Find all variable declarations
VariableDeclaration

# Find const declarations
VariableDeclaration[kind="const"]

# Find declarations with specific variable names
VariableDeclaration[declarations.id.name="myVar"]
```

### Finding Object Property Access

```bash
# Find all property access
MemberExpression

# Find specific property access
MemberExpression[property.name="length"]

# Find property access on specific objects
MemberExpression[object.name="myObject", property.name="method"]
```

### Finding Literals

```bash
# Find all literals
Literal

# Find string literals
Literal[value="hello"]

```

### Complex Queries

```bash
# Find async functions that return something
FunctionDeclaration[async="true"] > BlockStatement > ReturnStatement

# Find function calls with specific arguments
CallExpression[callee.name="require", arguments.0.value="fs"]

# Find nested function calls
CallExpression[callee.object.name="console", callee.property.name="log"]
```

## Error Handling

The grammar provides detailed error messages when parsing fails:

### Common Errors

1. **Missing quotes around strings:**

   ```
   Identifier[name=foo]  // Error: Expected "=" but "f" found
   ```

2. **Invalid attribute syntax:**

   ```
   Identifier[name="foo" value="bar"]  // Error: Expected "]" but "v" found
   ```

3. **Invalid child selector syntax:**
   ```
   FunctionDeclaration > > BlockStatement  // Error: Expected identifier but ">" found
   ```
