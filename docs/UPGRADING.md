# Upgrading

This file has one section per version, written by hand next to the generated `CHANGELOG.md`.

## 6.34.0

### Wire changes

None.

### Contract changes

- Relationship meta read by `_readIncludedWithMeta` no longer replaces a getter of the same name on the related model.
- The meta is kept per record and read with `protected relationshipMeta<T>(key)`.
- A key the model has no accessor for is still set as an own property.

### Required app actions

- In any model getter whose name is an edge field of a relationship read with `_readIncludedWithMeta`, read the edge value with `this.relationshipMeta<T>("<name>") ?? <the record's own value>`.

### What to look for in your app

Run each command from the root of your app.

- Every `_readIncludedWithMeta` call. Run `grep -rn "_readIncludedWithMeta" apps/*/src --include='*.ts'`.
- For each call, find the model it rehydrates and the edge field names of that relationship in the api descriptor.
- A getter of the same name on that model is the one to change. Run `grep -n "get <name>()" <model file>`.
- A model read with `_readIncluded` is not affected, even when its getter shares a name with an edge field.
