//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { GeckoCoinAPI } from "./client";
import { GETTEXT_DOMAIN } from "./constants";

const { GObject, St } = imports.gi;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

export const TrayButton = GObject.registerClass(
  class TrayButton extends PanelMenu.Button {
    onMenuItemClick() {
      const coinAPI = new GeckoCoinAPI();
      coinAPI.getCoinPrice(["bitcoin", "ethereum"], "eur");
      Main.notify(_("Whats up dingusSSSSS"));
    }

    _init() {
      super._init(0.0, _("My Shiny Indicator"));

      const button = new St.Bin({ style_class: "panel-button" });

      this.label = new St.Label({
        text: "test label",
      });

      button.set_child(this.label);

      this.add_child(button);

      const item = new PopupMenu.PopupMenuItem(_("Show Notification"));
      item.connect("activate", this.onMenuItemClick);

      this.menu.addMenuItem(item);
    }
  }
);
