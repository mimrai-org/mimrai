---
applyTo: "**/*.ts, **/*.tsx"
---

WHEN WRITING FORMS
- Use only the `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, and `FormMessage` components from `@/components/ui/form`.
  For example:
  ```tsx
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="jhondoe@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  </Form>
  ```
- Use the custom hook `useZodForm` to integrate `zod` with `react-hook-form`.
- add `"use client";` at the top of the file if you are using client-side hooks like `useState`, `useEffect`, or `useRouter`.
- Use `zod/v3` import for schema validation.
  ```tsx
  import { z } from "zod/v3";
  ```
- Define the schema outside of the component to avoid re-creation on each render.
- Use `form.handleSubmit(handleSubmit)` for form submission handling.
- Define `handleSubmit` function inside the component to handle form data.
- Example use of `useZodForm`:
  ```tsx
  const form = useZodForm(schema, {
    defaultValues: {
      email: "",
      password: "",
    },  
  });
  ```