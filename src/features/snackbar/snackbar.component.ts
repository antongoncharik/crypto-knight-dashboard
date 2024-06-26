import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

/**
 * @title Basic snack-bar
 */
@Component({
  selector: 'snack-bar-overview-example',
  // templateUrl: '',
  template: '',
  // styleUrl: 'snack-bar-overview-example.css',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule],
})
export class SnackBarOverviewExample {
  constructor(private _snackBar: MatSnackBar) {}

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }
}
