import { Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import feather from "feather-icons";
import { DepartmentViewService } from "./department-view.service";
import { CoreSidebarService } from "@core/components/core-sidebar/core-sidebar.service";
import { CoreConfigService } from "@core/services/config.service";
@Component({
  selector: "app-department-view",
  templateUrl: "./department-view.component.html",
  styleUrls: ["./department-view.component.scss"],
})
export class DepartmentViewComponent implements OnInit, OnDestroy {
  // public
  public url = this.router.url;
  public lastValue;
  public data;
  public rows;
  private tempData = [];

  // private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {Router} router
   * @param {DepartmentViewService} _departmentViewService
   */
  constructor(
    private router: Router,
    private _departmentViewService: DepartmentViewService,
    private _coreSidebarService: CoreSidebarService,
    private _coreConfigService: CoreConfigService
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
    // Subscribe config change
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        //! If we have zoomIn route Transition then load datatable after 450ms(Transition will finish in 400ms)
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._departmentViewService.onUserViewChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                console.log("response123", response);
                this.rows = response;
                this.tempData = this.rows;
              });
          }, 450);
        } else {
          this._departmentViewService.onUserViewChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
              this.rows = response;
              this.tempData = this.rows;
            });
        }
      });
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
