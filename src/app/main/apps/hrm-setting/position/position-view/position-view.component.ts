import { Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import feather from "feather-icons";
import { PositionViewService } from "./position-view.service";
@Component({
  selector: "app-position-view",
  templateUrl: "./position-view.component.html",
  styleUrls: ["./position-view.component.scss"],
})
export class PositionViewComponent implements OnInit, OnDestroy {
  // public
  public url = this.router.url;
  public lastValue;
  public data;

  // private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {Router} router
   * @param {PositionViewService} _positionViewService
   */
  constructor(
    private router: Router,
    private _positionViewService: PositionViewService
  ) {
    this._unsubscribeAll = new Subject();
    this.lastValue = this.url.substr(this.url.lastIndexOf("/") + 1);
  }

  // ngAfterViewInit() {
  //   feather.replace(); // Thay thế các icon Feather
  // }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  /**
   * On init
   */
  ngOnInit(): void {
    // this._branchViewService.onUserViewChanged
    //   .pipe(takeUntil(this._unsubscribeAll))
    //   .subscribe((response) => {
    //     this.data = response;
    //   });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
