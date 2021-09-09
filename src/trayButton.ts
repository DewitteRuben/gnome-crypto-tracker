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

      this.priceLabel = new St.Label({
        text: "Loading price data...",
        style_class: "price-label",
        y_align: St.Align.MIDDLE,
      });

      this.priceChangeLabel = new St.Label({
        text: "0%",
        style_class: "price-change-label",
        y_align: St.Align.MIDDLE,
      });

      this.timeRange = new St.Label({
        text: "",
        style_class: "price-time-range-label",
      });

      this.icon = new St.Icon({
        style_class: "system-status-icon",
        y_align: St.Align.MIDDLE,
      });

      this.container.add_actor(this.icon);
      this.container.add_actor(this.priceLabel);
      this.container.add_actor(this.priceChangeLabel);
      this.container.add_actor(this.timeRange);

      this.container.connect(
        "button-press-event",
        this.onSettingsClick.bind(this)
      );

      getPriceService().setTrayButton(this);
      getPriceService().start();

      this.add_child(this.container);
    }

    destroy() {
      super.destroy();
      getPriceService().stop();
    }
  }
);
