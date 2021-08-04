// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { GETTEXT_DOMAIN } from "./constants";
import { TrayButton } from "./trayButton";

/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;

class Extension {
  private uuid: any;
  private trayButton: any;
  private settings: any;

  constructor(uuid: string) {
    this.uuid = uuid;
    ExtensionUtils.initTranslations(GETTEXT_DOMAIN);

    this.settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.cryptopricetracker"
    );
  }

  enable() {
    this.trayButton = new TrayButton();
  
    this.settings.bind(
      "show-indicator",
      this.trayButton,
      "visible",
      Gio.SettingsBindFlags.DEFAULT
    );

    Main.panel.addToStatusArea(this.uuid, this.trayButton);
  }

  disable() {
    this.trayButton.destroy();
    this.trayButton = null;
  }
}

// @ts-ignore
function init(meta: { uuid: string }) {
  return new Extension(meta.uuid);
}
