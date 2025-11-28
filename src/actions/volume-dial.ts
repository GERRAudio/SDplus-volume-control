import { action, SingletonAction, KeyDownEvent, WillAppearEvent, WillDisappearEvent, streamDeck, DialRotateEvent } from "@elgato/streamdeck";

import renderVolumeImage from "../utils/volumeRenderer";
import { Smoother } from "../utils/smoother";

type Settings = {
  step?: number;
  renderSize?: number;
  smoothingSpeed?: number;
  smoothingTickMs?: number;
};

@action({ UUID: "com.example.streamdeckplus.volume-dial" })
export class VolumeDial extends SingletonAction<Settings> {
  private targetVolume = 50;
  private muted = false;
  private step = 1;
  private renderSize = 240;

  private smoother: Smoother;
  private lastRenderAt = 0;
  private minRenderIntervalMs = 40;

  private lastAction?: DialAction<Settings>;

  constructor() {
    super();
    this.smoother = new Smoother({
      initial: this.targetVolume,
      speed: 0.18,
      tickMs: 33,
      onStep: (v) => this.onSmootherStep(v)
    });
  }

  override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
    this.lastAction = ev.action;
    const settings = ev.payload.settings ?? ({} as Settings);
    this.step = settings.step ?? 1;
    this.renderSize = settings.renderSize ?? 240;

    this.smoother = new Smoother({
      initial: this.targetVolume,
      speed: settings.smoothingSpeed ?? 0.18,
      tickMs: settings.smoothingTickMs ?? 33,
      onStep: (v) => this.onSmootherStep(v)
    });

    await this.pushImageToAction(this.lastAction, Math.round(this.smoother.getCurrent()));
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
    const settings = ev.payload.settings ?? ({} as Settings);
    this.step = settings.step ?? 1;
    this.renderSize = settings.renderSize ?? 240;

    this.smoother = new Smoother({
      initial: this.smoother.getCurrent(),
      speed: settings.smoothingSpeed ?? 0.18,
      tickMs: settings.smoothingTickMs ?? 33,
      onStep: (v) => this.onSmootherStep(v)
    });
  }

  override async onDialRotate(ev: DialRotateEvent<Settings>): Promise<void> {
    this.lastAction = ev.action;
    const ticks = ev.payload.ticks ?? 0;
    this.targetVolume = Math.max(0, Math.min(100, this.targetVolume + ticks * this.step));

    if (this.muted && this.targetVolume > 0) this.muted = false;

    this.smoother.setTarget(this.muted ? 0 : this.targetVolume);
  }

  override async onDialDown(ev: DialDownEvent<Settings>): Promise<void> {
    this.lastAction = ev.action;
    this.muted = !this.muted;

    this.smoother.setTarget(this.muted ? 0 : this.targetVolume);

    await this.pushImageToAction(ev.action, Math.round(this.smoother.getCurrent()));
  }

  public async onBackendVolumeChanged(newVolume: number, muted: boolean) {
    this.targetVolume = Math.max(0, Math.min(100, newVolume));
    this.muted = !!muted;
    this.smoother.setTarget(this.muted ? 0 : this.targetVolume);
    if (this.lastAction) {
      await this.pushImageToAction(this.lastAction, Math.round(this.smoother.getCurrent()));
    }
  }

  private async onSmootherStep(displayedValue: number) {
    const now = Date.now();
    if (now - this.lastRenderAt < this.minRenderIntervalMs) return;
    this.lastRenderAt = now;
    if (this.lastAction) {
      await this.pushImageToAction(this.lastAction, Math.round(displayedValue));
    }
  }

  private async pushImageToAction(action: DialAction<Settings> | undefined, displayedVolume: number) {
    if (!action) return;
    const dataUrl = await renderVolumeImage(displayedVolume, this.muted, { size: this.renderSize });
    try {
      try {
        // @ts-ignore
        await action.setImage(dataUrl);
      } catch {
        // fallback
        // @ts-ignore
        await action.setImage({ image: dataUrl });
      }
    } catch (err) {
      console.error("Failed to call action.setImage:", err);
    }

    try {
      await action.setTitle(this.muted ? "Muted" : `${displayedVolume}%`);
    } catch {
    }
  }

  override async onWillDisappear(): Promise<void> {
    this.smoother.dispose();
    this.lastAction = undefined;
  }
}