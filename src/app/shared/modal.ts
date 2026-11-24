import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-backdrop" (click)="close.emit()"></div>
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal__header">
        <h2>{{ title }}</h2>
        <button
          type="button"
          class="icon-btn"
          aria-label="Cerrar"
          (click)="close.emit()"
        >
          ×
        </button>
      </header>
      <div class="modal__body">
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input() title = '';
  @Output() readonly close = new EventEmitter<void>();
}
