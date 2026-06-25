# React Native HTML Elements

## Pitfall
Using HTML elements (`<div>`, `<h1>`, `<p>`, `<span>`, etc.) in React Native components. These are NOT valid React Native components and cause runtime crashes.

## Rule
React Native uses its own component primitives. Always use `<View>`, `<Text>`, `<Image>`, etc. from `react-native`.

## Mapping

| HTML Element | React Native Equivalent |
|-------------|----------------------|
| `<div>` | `<View>` |
| `<h1>`, `<h2>`, `<h3>`, `<p>`, `<span>` | `<Text>` |
| `<img>` | `<Image>` |
| `<a>` | `<TouchableOpacity>` or `<Pressable>` + `<Text>` |
| `<ul>`, `<li>` | `<View>` + `<Text>` |
| `<form>` | `<View>` |

## Common Mistake
```tsx
// BAD: Works in web, crashes in React Native
import React from 'react';
export default function App() {
  return (
    <div style={{ flex: 1 }}>
      <h1>Hello</h1>
      <p>World</p>
    </div>
  );
}

// GOOD: Works everywhere
import React from 'react';
import { View, Text } from 'react-native';
export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Hello</Text>
      <Text>World</Text>
    </View>
  );
}
```

## Checklist
- [ ] No `<div>`, `<h1>`, `<p>`, `<span>`, `<img>` in React Native code
- [ ] All imports from `react-native`, not `react`
- [ ] Styles use camelCase (flexDirection, not flex-direction)
- [ ] Expo projects: use `<StatusBar />` for status bar control
