import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Settings } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsRepository extends BaseRepository<Settings> {
  protected collectionKey = 'settings';
  protected idKey: keyof Settings = 'settingsId';
}
