---
title: Demo Doc
order: 999
---

# Demo Doc

This is a doc to demonstrate different syntax and options available in the
documentation pages.

## Frontmatter

Doc pages require frontmatter, which is written at the top of the file in YAML
format. The two properties that matter are `title` and `order`, which is used to
determine what order the pages appear in.

```
---
title: Demo Doc
order: 1
---

# Demo Doc
```

## Images

Images can be referenced using a relative path, like this:

```
# The exclamation mark causes the image to be displayed in place of the Thorium Logo text.
![Thorium Logo](../../images/logo.svg)

# Image Demo
```

![Thorium Logo](../../../images/logo.svg)
