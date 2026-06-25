# Zod z.any() Replacement

## Pitfall
Using `z.any()` in Zod schemas skips all runtime validation. This creates prototype pollution vectors and bypasses type safety. Attackers can inject `__proto__` keys.

## Rule
Never use `z.any()`. Always define a concrete schema, even for flexible fields.

## Pattern

```typescript
// BAD: Skips all validation
const schema = z.object({
  metadata: z.any().optional(),
  triggerCondition: z.any().optional(),
});

// GOOD: Validates structure while allowing flexibility
const schema = z.object({
  metadata: z.record(z.unknown()).optional(),
  triggerCondition: z.record(z.unknown()).optional(),
});
```

## Alternatives to z.any()
| Use Case | Replacement |
|----------|------------|
| Arbitrary JSON object | `z.record(z.unknown())` |
| Array of any values | `z.array(z.unknown())` |
| String or number | `z.union([z.string(), z.number()])` |
| Optional flexible field | `z.any().nullable()` → `z.record(z.unknown()).nullable()` |
| Unvalidated field | Add actual validation schema |

## Prisma JSON Field Compatibility
Prisma `Json` fields accept `any` type. When Zod validates to `Record<string, unknown>`, cast for Prisma:
```typescript
await prisma.model.create({
  data: {
    metadata: (body.metadata ?? null) as any,
  },
});
```

## Checklist
- [ ] No `z.any()` in any schema
- [ ] All user inputs have explicit validation
- [ ] Flexible fields use `z.record(z.unknown())`
- [ ] Prisma JSON casts use `as any` only (not bypassing Zod)
