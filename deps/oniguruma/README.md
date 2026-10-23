# Oniguruma

The regex library that `lib/hl/onig.zig` is built with, from the
[v6.9.10 release](https://github.com/kkos/oniguruma/releases/tag/v6.9.10)
(`onig-6.9.10.tar.gz`, SHA-256
`2a5cfc5ae259e4e97f86b68dfffc152cdaffe94e2060b770cb827238d769fc05`). It is
the final release: the project ended on 24 April 2025. Its licence is in
`COPYING`.

`src/` holds only the files that a UTF-8 build needs, unchanged. `info.edn`
lists the `.c` files that are compiled. The others in `src/` are headers, or
Unicode tables that `unicode.c` includes.

`config/config.h` replaces the one that Oniguruma's build generates. Its
values are for 64-bit Unix targets with the LP64 data model, such as
`aarch64-macos` and `x86_64-linux-musl`.
