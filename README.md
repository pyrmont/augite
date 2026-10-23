# augite

augite generates a static site for one or more Git repositories, in the
manner of [stagit](https://codemadness.org/stagit.html).

## Usage

```
augite repo [-o <dir>] [-g <grammars>] [-c <dir>] [-p <n>] [-u <base-url>] <repo-dir>
augite index [-o <dir>] <repo-dir>...
```

`repo` writes one repository's site into `<dir>` (default: the current
directory). `-g` names the directory of TextMate grammars to highlight file
pages with, and `-c` a directory in which to keep highlighted files between
runs, so that only files that have changed are highlighted again. `-p` sets
the commits per log page (default: 50), and `-u` the URL used to make links in
the Atom feeds absolute. `index` writes the list of repositories.

As in stagit, the files `description`, `owner` and `url` in the repository
directory give the description, the owner and the clone URL.

## Building

```
wattle build exe --target x86_64-linux-musl
```

The result is a static executable in `zig-out/bin/`.

## Deployment

augite is run from each repository's `post-receive` hook.
`res/hooks/post-receive` is an example that writes the repository's site and
the list of repositories. It rebuilds in the background, so a push does not
wait for the site, and it writes its output to `augite.log` in the
repository. One rebuild runs at a time, and the pushes made during a rebuild
are covered by one more.

1. Copy the executable to `/usr/local/bin/augite` and `res/grammars/` to
   `/usr/local/share/augite/grammars`. The hook also needs `flock` and
   `setsid` from util-linux.
2. Edit the paths and URL at the top of the example hook and install it as
   `hooks/post-receive` in each bare repository. It must be executable.
3. Run the hook once in each repository, as the user that owns the output
   directory, rather than waiting for a push:

   ```
   cd /var/git/<name>.git && ./hooks/post-receive
   ```

augite does not write `logo.png` or `favicon.png`. Every page links to both,
and the list of repositories links to each repository's `logo.png`. The
example hook links them from a shared directory of images.

### Switching from stagit

Before the first run in an output directory that stagit wrote:

- Remove stagit's commit pages, `rm -r commit`. augite never rewrites a commit
  page that exists, so stagit's pages would be kept as they are.
- Remove stagit's cache file if the hook passed `-c` to stagit.
- Remove the hook's links for `style.css` and `index.html`. augite writes both
  files, and replaces a link at either path rather than writing to its target.
- Leave `logo.png` and `favicon.png`.

Pages that stagit wrote and augite does not are left in place. The other pages
have the same paths as stagit's, except that log pages after the first are
`log/<n>.html`.

### Upgrading augite

A commit page is written once and kept, so it keeps the markup, footer and
asset links of the version of augite that wrote it. To rewrite every commit
page after an upgrade, remove the `commit` directory and run the hook again.
