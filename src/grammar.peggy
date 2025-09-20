{
  function normalizeTypeName(raw) {
    if (!raw) return "";
    return raw[0].toUpperCase() + raw.slice(1);
  }

  function deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          target.hasOwnProperty(key)
        ) {
          // If both are objects, recurse
          target[key] = deepMerge(target[key], source[key]);
        } else {
          // Otherwise, assign the value
          target[key] = source[key];
        }
      }
    }
    return target;
  }
}

// Entry point that trims leading and trailing whitespace
Start
  = _ q:Query _ { return q; }

// Main entry point of the grammar. It nests selectors using a 'child' property.
Query
  = head:Selector tail:(_ ">" _ Selector)* {
      let root = head;
      let current = root;
      for (const [, , , child] of tail) {
        current.child = child;
        current = current.child;
      }
      return root;
  }

// A selector, which can have a type and attributes
Selector
  = t:TypeName? attrs:AttrList? {
      const obj = {};
      if (t) obj.type = normalizeTypeName(t);
      if (attrs) deepMerge(obj, attrs);
      return obj;
  }

// A list of attributes within a selector (e.g., [value="observer"])
AttrList
  = "[" _ first:Attr rest:(_ "," _ Attr)* _ ","? _ "]" {
      let result = {};
      deepMerge(result, first);
      for (const r of rest) {
        deepMerge(result, r[3]);
      }
      return result;
  }

// A single key-value attribute (e.g., value="observer")
Attr
  = k:Key _ "=" _ v:Value { return k(v); }

// The possible values for an attribute
Value
  = String
  / Number
  / True
  / False
  / Null
  / Array
  / Selector

True  = "true"  ![A-Za-z0-9_] { return true; }
False = "false" ![A-Za-z0-9_] { return false; }
Null  = "null"  ![A-Za-z0-9_] { return null; }

// Defines a comma-separated array of values
Array
  = "[" _ first:Value rest:(_ "," _ Value)* _ ","? _ "]" {
      return [first, ...rest.map(r => r[3])];
  }

// Defines double and single quoted strings
String
  = '"' chars:CharDouble* '"' { return chars.map(c => typeof c === "string" ? c : c[1]).join(""); }
  / "'" chars:CharSingle* "'" { return chars.map(c => typeof c === "string" ? c : c[1]).join(""); }

// Characters within a double-quoted string, handling escape sequences
CharDouble
  = "\\\\" esc:. {
      switch(esc){
        case 'n': return '\\n';
        case 't': return '\\t';
        case 'r': return '\\r';
        case '"': return '"';
        case "'": return "'";
        case '\\\\': return '\\\\';
        default: return esc;
      }
    }
  / [^"\\\\] { return text(); }

// Characters within a single-quoted string, handling escape sequences
CharSingle
  = "\\\\" esc:. {
      switch(esc){
        case 'n': return '\\n';
        case 't': return '\\t';
        case 'r': return '\\r';
        case '"': return '"';
        case "'": return "'";
        case '\\\\': return '\\\\';
        default: return esc;
      }
    }
  / [^'\\\\] { return text(); }

// Defines a number, including decimals and negative signs
Number
  = "-"? [0-9]+ ("." [0-9]+)? { return parseFloat(text()); }

// A type name for a node (e.g., CallExpression)
TypeName
  = [A-Za-z][A-Za-z0-9]* { return text(); }

// A key, which can be a nested path. Returns a function that builds the object.
Key
  = head:KeySegment tail:("." KeySegment)* {
      return (value) => {
        let result = {};
        let current = result;
        const segments = [head, ...tail.map(t => t[1])];
        for (let i = 0; i < segments.length - 1; i++) {
          current[segments[i]] = {};
          current = current[segments[i]];
        }
        current[segments[segments.length - 1]] = value;
        return result;
      };
    }

// A single segment of a key path
KeySegment
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

// Defines optional whitespace
_ = [ \t\n\r]*
