import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot,
} from "@angular/router";
import { environment } from "environments/environment";

import { BehaviorSubject, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { Department } from "shared/models/department.model";
@Injectable()
export class DepartmentListService implements Resolve<any> {
  public rows: any;
  public onUserListChanged: BehaviorSubject<any>;

  /**
   * Constructor
   *
   * @param {HttpClient} _httpClient
   */
  constructor(private _httpClient: HttpClient) {
    // Set the defaults
    this.onUserListChanged = new BehaviorSubject({});
  }

  /**
   * Resolver
   *
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.getDataTableRows()]).then(() => {
        resolve();
      }, reject);
    });
  }
  createDepartment(departmentData: any): Observable<any> {
    return this._httpClient.post(
      `${environment.apiUrl}/department`,
      departmentData
    );
  }

  updateDepartment(
    departmentId: number,
    departmentData: Department
  ): Observable<any> {
    return this._httpClient
      .put(`${environment.apiUrl}/department/${departmentId}`, departmentData)
      .pipe(
        map((response: any) => {
          console.log("Department updated successfully:", response);
          return response;
        }),
        catchError((error) => {
          console.error("Error updating department:", error);
          throw error;
        })
      );
  }

  deleteDepartment(departmentIds: number[]): Observable<any> {
    const options = {
      headers: { "Content-Type": "application/json" },
      body: { ids: departmentIds }, // Đẩy dữ liệu ids vào body của yêu cầu DELETE
    };

    return this._httpClient
      .delete(`${environment.apiUrl}/department`, options)
      .pipe(
        map((response: any) => {
          console.log("Departments deleted successfully:", response);
          return response;
        }),
        catchError((error) => {
          console.error("Error deleting departments:", error);
          throw error;
        })
      );
  }

  getDepartmentByBranch(branchId: number): Observable<any> {
    return this._httpClient.get(
      `${environment.apiUrl}/department/branch/${branchId}`
    );
  }

  /**
   * Get rows
   */
  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/department`)
        .subscribe((response: any) => {
          this.rows = response.data;
          console.log("response", response.data);
          this.onUserListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }
}
