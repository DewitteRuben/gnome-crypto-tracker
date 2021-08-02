clean:
	rm -rf *.js

compile:
	glib-compile-schemas schemas && tsc -p . && node fileParser/parser.js

run:
	dbus-run-session -- gnome-shell --nested --wayland

prefs:
	gnome-extensions prefs cryptopricetracker@rubendewitte.com