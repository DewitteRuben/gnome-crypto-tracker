//@ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { GETTEXT_DOMAIN } from "./constants";
import { getPriceService } from "./price_service";

const { GObject, St } = imports.gi;

const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

export const TrayButton = GObject.registerClass(
  class TrayButton extends PanelMenu.Button {
    onSettingsClick() {
      Main.extensionManager.openExtensionPrefs(Me.metadata.uuid, "", {});
    }

    _init() {
      super._init(0.0, _("My Shiny Indicator"));

      this.container = new St.BoxLayout({
        style_class: "panel-button",
        reactive: true,
        can_focus: true,
        track_hover: true,
      });

      this.label = new St.Label({
        text: "test label",
      });

      this.icon = new St.Icon({
        style_class: "system-status-icon",
      });

      this.container.add_actor(this.icon);
      this.container.add_actor(this.label);
      this.container.connect('button-press-event', this.onSettingsClick.bind(this))

      getPriceService().setTrayButton(this);
      getPriceService().start();

      this.add_child(this.container);
    }
  }
);
