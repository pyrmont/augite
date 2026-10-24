# Augite

[![Test Status][test-badge]][test-status]

[test-badge]: https://github.com/pyrmont/augite/actions/workflows/test.yml/badge.svg
[test-status]: https://github.com/pyrmont/augite/actions/workflows/test.yml

Augite is a static site generator for Git repositories. This repository provides
`augite`, a command-line utility written in the Wattle programming language.

It is similar to [stagit][] but adds:

[stagit]: https://codemadness.org/stagit.html

- a responsive stylesheet for a nicer experience on small screens
- a dash of JavaScript to make navigating the file tree more pleasant
- support for syntax highlighting using TextMate's language grammars

## Building

#### Pre-Built

Pre-built binaries of `augite` are available as tarballs via the
[Releases][github-releases] section on GitHub for:

- Linux (x86-64 and aarch64)
- macOS (aarch64)

[github-releases]: https://github.com/pyrmont/augite/releases

```console
$ curl -LO https://github.com/pyrmont/augite/releases/latest/download/augite-<version>-<platform>-<arch>.tar.gz
$ tar -xzf augite-<version>-<platform>-<arch>.tar.gz
$ cd augite-<version>
```

#### From Source

To build the `augite` binary from source, you need [Zig][] 0.17.0 and
[Wattle][] 0.3.0 or later installed on your system. Then you can run:

[Zig]: https://ziglang.org
[Wattle]: https://github.com/pyrmont/wattle

```sh
git clone https://github.com/pyrmont/augite.git
cd augite
wattle build exe
```

The executable is at `zig-out/bin/augite`. The Wattle runtime is compiled into
the file so the target system does not need Wattle to be installed.

Augite builds for Unix-like systems and has been tested on `aarch64-macos` and
`x86_64-linux-musl`. Windows is not supported. To build for a target different
than the building system use `--target`. See `man wattle-build` for more
information.

## Installing

Move the `augite` binary somewhere on your path and the man pages to the
appropriate locations. For example:

```console
# use sudo or doas depending on the permissions of the target directories
$ sudo cp zig-out/bin/augite /usr/local/bin/
$ sudo cp man/man1/*.1 /usr/local/share/man/man1/
```
If you have Wattle installed, you can instead build and install `augite` and
its man pages under your `WATTLE_PREFIX` in one step:

```console
$ wattle apps install https://github.com/pyrmont/augite
```

The `augite` binary is placed in the prefix's `bin/` directory and the man
pages in `share/man/`. Run `wattle apps upgrade augite` to reinstall it from
the repository and `wattle apps remove augite` to remove it.

## Using

Run `zig-out/bin/augite --help` for commands and options. See
[`augite(1)`][augite-man] for an overview of the commands.

[augite-man]: man/man1/augite.1.predoc

### Prerequisites

`git` must be installed where `augite` runs.

### Setting Up a Repository

Augite reads the repository's description, owner and clone URL from files named
`description`, `owner` and `url`. Use `setup` to write these files in the
server's repository directory:

```sh
augite setup -d "The Analytical Engine" --owner "Ada Lovelace" -u https://example.org/engine.git /var/git/engine.git
```

Only the fields you specify are changed. Pass an empty value to remove a field,
or run `setup` without options to show the current values:

```sh
augite setup --owner "" /var/git/augite.git
augite setup /var/git/augite.git
```

See [`augite-setup(1)`][setup-man] for all options (`man augite-setup`).

[setup-man]: man/man1/augite-setup.1.predoc

### Generating Repository Pages

Use `repo` to generate the site for a repository:

```sh
augite repo -o /path/to/docroot/engine -g /path/to/grammars .
```

Without `-g`, file pages are plain text. To add a language, copy its
`.tmLanguage.json` file to the directory that is passed to `-g`.

See [`augite-repo(1)`][repo-man] for all options and generated files (`man
augite-repo`).

[repo-man]: man/man1/augite-repo.1.predoc

### Listing Repositories

Use `index` to create an index page that lists one or more repositories:

```sh
augite index -o public .
```

See [`augite-index(1)`][index-man] for all options (`man augite-index`).

[index-man]: man/man1/augite-index.1.predoc

## Deploying

### Serving the Pages

Augite writes static files. Generate them in a directory that your web server
serves or copy the generated files to your hosting provider. The web server
only needs to serve the files; it does not need to run Augite or have access
to the Git repositories.

If you have several repositories, you can generate each site in its own
subdirectory and use `augite index` to create a page that lists the
repositories. See [`augite-index(1)`][index-man] for details.

Augite writes HTML that expects a `logo.png` and `favicon.png` in each
repository's directory but does not create them. You need to create these
images separately. The repository index also uses each repository's `logo.png`.

### Rebuilding After a Push

The generated pages are a snapshot of the repository. To keep the pages up to
date, you need to run `augite repo` after each change to the repository. You can
do this manually, on a schedule, or as part of a deployment job.

If you host the Git repositories yourself on a remote machine, Git can be
configured to run these commands automatically after a push. A *hook* is an
executable file that Git runs when a particular event occurs. The
`post-receive` hook runs in the repository that receives a push after its
references have been updated. It runs as the user handling the push, so that
user needs permission to write the generated pages and any highlighting cache.

For a bare repository, place the script in `hooks/post-receive` inside the
repository. For a repository with a working tree, the usual location is
`.git/hooks/post-receive`. Git can use a different hooks directory if
`core.hooksPath` is configured; see `man githooks` for more information.

This minimal hook rebuilds one repository's site:

```sh
#!/bin/sh
set -e

# Replace these paths with the locations on your system.
augite="/path/to/augite"
output="/path/to/docroot/repo"

# Git runs post-receive with the Git directory as the working directory.
repo=$(pwd)
unset GIT_DIR
"$augite" repo -o "$output" "$repo"
```

Use an absolute path to the Augite executable, since the hook may have a
different `PATH` from your interactive shell. Add options such as `-g` for
grammars, `-c` for a highlighting cache and `-u` for the site's base URL as
needed. If a `post-receive` hook already exists, add the rebuild command to
it rather than replacing it.

Make the hook executable with `chmod +x hooks/post-receive`, adjusting the
path for your repository. To generate the initial site and check the script,
run it from the Git directory as the user that will handle pushes:

```sh
cd /path/to/repo
sudo -u <git-user> ./hooks/post-receive
```

Later pushes to that repository will run it automatically. This simple hook
rebuilds before the push command returns. If you maintain a repository index,
add an `augite index` command after the rebuild, passing the paths of all the
repositories you want to list.

### Using the Example Hook

The [example hook][post-receive] provides a more complete setup for a Linux
server. It rebuilds in the background so pushes can return promptly, and
records output in `augite.log` in the repository. It allows one rebuild at a
time per repository; pushes received during a rebuild trigger another pass.

[post-receive]: res/hooks/post-receive

This script needs `flock` and `setsid`. Before installing it, adapt the
executable, output, grammar and cache paths, the site's base URL, the image
links and the repository paths passed to `augite index`. The paths in the
script describe one server's layout; choose locations appropriate to your own
installation. Install and test it in the same way as the minimal hook above.

### Switching from stagit

Before the first run in an output directory that stagit wrote:

- Remove stagit's commit pages, `rm -r commit`. Augite never rewrites a commit
  page that exists, so stagit's pages would be kept as they are.
- Remove stagit's cache file if the hook passed `-c` to stagit.
- Remove the hook's links for `style.css` and `index.html`. Augite writes both
  files, and replaces a link at either path rather than writing to its target.
- Leave `logo.png` and `favicon.png`.

Pages that stagit wrote for files that are no longer in the tree are removed.
Other pages have the same paths as stagit's, except that log pages after the
first are `log/<n>.html`.

## Testing

Build the native highlighting module, then run the Wattle test files:

```sh
wattle build lib
wattle test
```

Run these commands from the project root. The tests need `git` and build
fixture repositories in `tmp/`. The [test workflow][test-status] builds and
tests Augite on Linux and macOS, including CLI and page-generation checks.

## Documentation

The man pages are written in [Predoc][]. Edit the `.predoc` sources in
`man/man1/` and regenerate the corresponding pages with:

[Predoc]: https://github.com/pyrmont/predoc

```sh
wattle res/tools/manpage.wattle
```

The script requires `predoc` on your path and skips pages whose generated
files are up to date. Use `-f` to regenerate all pages, or pass source names
to select pages:

```sh
wattle res/tools/manpage.wattle -f augite-repo.1.predoc
```

To install the pages manually, copy `man/man1/*.1` to your man page
directory, such as `/usr/local/share/man/man1/`.

## Releasing

Update the version in `info.edn` and the Predoc sources, regenerate the
manuals, and run the tests. For example, for version `0.1.0`:

```sh
wattle res/tools/version.wattle 0.1.0
wattle build lib
wattle test
```

The version script requires `predoc` on your path. Like the manual-generation
script, it locates the project from its own path and can run from any directory.

Review and commit the updated `info.edn`, `.predoc` sources and generated
manuals along with any other release changes. Tag that commit and push the
commit and tag:

```sh
git tag v0.1.0
git push origin master
git push origin v0.1.0
```

In GitHub Actions, run the [release workflow][release-workflow] with the
`version` input set to the full tag, such as `v0.1.0`. It tests and builds
the tagged source, packages the three platform archives and creates a draft
release with generated notes. Review the notes and archives before publishing
the release.

[release-workflow]: https://github.com/pyrmont/augite/actions/workflows/release.yml

After tagging the release, run `wattle res/tools/version.wattle DEVEL` and
commit the resulting changes to return to development.

## Bugs

Report issues in [GitHub Issues][issues].

[issues]: https://github.com/pyrmont/augite/issues

## License

Augite is licensed under the MIT License. See [LICENSE][]. Oniguruma keeps its
own license, which is in `deps/oniguruma/`.

[LICENSE]: LICENSE
