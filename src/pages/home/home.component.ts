import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { DateTime } from 'luxon';
import {
  FormGroup,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

import {
  CommonService,
  TracksServices,
  BinancePriceService,
  AuthService,
} from '../../services';
import { Track } from '../../entities/track';
import { Q1, Q3, SYMBOLS } from '../../constants';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    JsonPipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  providers: [
    CommonService,
    TracksServices,
    provideNativeDateAdapter(),
    BinancePriceService,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private tracksSubscription: Subscription = new Subscription();
  private pricesSubscription: Subscription = new Subscription();
  tracks: Track[] = [];
  activeTracks: Track[] = [];
  orderTracks: Track[] = [];
  range = new FormGroup({
    from: new FormControl<Date | null>(new Date()),
    to: new FormControl<Date | null>(new Date()),
  });
  isLoadingTracks: boolean = false;
  isLoadingPrices: boolean = false;
  prices: { [key: string]: number } = {};
  symbols = SYMBOLS.sort();
  symbolControl = new FormControl<string>('');
  fullControl = new FormControl(false);

  constructor(
    private tracksService: TracksServices,
    private binancePriceService: BinancePriceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isActive) {
      // this.getTracks();
    }
  }

  ngOnDestroy() {
    this.tracksSubscription.unsubscribe();
    this.pricesSubscription.unsubscribe();
  }

  getTracks() {
    this.isLoadingTracks = true;

    const from = DateTime.fromJSDate(this.range.value?.from ?? new Date())
      .startOf('day')
      .toFormat('yyyy-MM-dd HH:mm:ss');
    const to = DateTime.fromJSDate(this.range.value?.to ?? new Date())
      .endOf('day')
      .toFormat('yyyy-MM-dd HH:mm:ss');
    const symbol = this.symbolControl.value ?? '';
    const full = this.fullControl.value ?? true;

    this.tracksSubscription = this.tracksService
      .getTracks({
        from,
        to,
        symbol,
        full,
      })
      .subscribe({
        next: (res) => {
          this.tracks = res;
          this.activeTracks = res.map((item) => {
            const date = DateTime.fromISO(item.createdAt, { zone: 'utc' });
            const dateInZone = date.setZone('UTC+0');
            const createdAt = dateInZone.toFormat('yyyy-MM-dd HH:mm');

            const dateHighCreatedAt = DateTime.fromISO(item.highCreatedAt, { zone: 'utc' });
            const dateHighCreatedAtInZone = dateHighCreatedAt.setZone('UTC+0');
            const highCreatedAt = dateHighCreatedAtInZone.toFormat('yyyy-MM-dd HH:mm');

            const dateLowCreatedAt = DateTime.fromISO(item.lowCreatedAt, { zone: 'utc' });
            const dateLowCreatedAtInZone = dateLowCreatedAt.setZone('UTC+0');
            const lowCreatedAt = dateLowCreatedAtInZone.toFormat('yyyy-MM-dd HH:mm');

            const [lowStopPrice, highStopPrice] = this.getStopLossPrices(
              item.lowPrice,
              item.highPrice
            );

            return {
              ...item,
              createdAt,
              highCreatedAt,
              lowCreatedAt,
              lowStopPrice: +lowStopPrice.toFixed(5),
              highStopPrice: +highStopPrice.toFixed(5),
            };
          });
          this.orderTracks = this.activeTracks.filter((item) => item.isOrder)

          this.isLoadingTracks = false;

          this.getPrices();
        },
        error: (err) => {
          this.isLoadingTracks = false;
          console.error(err);
        },
      });
  }

  getPrices() {
    this.isLoadingPrices = true;

    this.pricesSubscription = this.binancePriceService.getPrices().subscribe({
      next: (prices) => {
        prices.forEach((price) => {
          this.prices[price.symbol] = price.price;

          const track = this.activeTracks.find((item) => {
            return item.symbol === price.symbol;
          });
          if (track) {
            if (track.highPrice>0){
              const q3 = track.highPrice - (track.highPrice * Q1 / 100);
              if (price.price >= q3) {
                track.direction = 'green';
              }
            }
            if (track.lowPrice>0){
              const q1 = track.lowPrice + (track.lowPrice * Q1 / 100);
              if (price.price <= q1) {
                track.direction = 'red';
              }
            }
          }
        });

        this.isLoadingPrices = false;
      },
      error: (err) => {
        this.isLoadingPrices = false;
        console.error(err);
      },
    });
  }

  handleClickGetTracks() {
    this.getTracks();
  }

  private getStopLossPrices(lowPrice: number, highPrice: number) {
    return [lowPrice + (lowPrice * 3) / 100, highPrice - (highPrice * 3) / 100];
  }

  clearSymbol() {
    this.symbolControl.reset();
  }
}
