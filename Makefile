clean:
	rm -rf *.js

compile:
	glib-compile-schemas schemas && tsc -p . && node fileParser/parser.js

run: compile
	dbus-run-session -- gnome-shell --nested --wayland

prefs: compile
	gnome-extensions prefs cryptopricetracker@rubendewitte.com && journalctl -f --since 'now'