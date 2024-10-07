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
import { Branch } from "shared/models/branch.model";

@Injectable()
export class BranchService implements Resolve<any> {
  public rows: any[] = [];
  public onBranchListChanged: BehaviorSubject<any>;

  constructor(private _httpClient: HttpClient) {
    // Set the defaults
    this.onBranchListChanged = new BehaviorSubject([]);
  }


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

  getProvinces(): Observable<any> {
    return this._httpClient.get('/api/p');
  }

  getDistricts(provinceId: string): Observable<any> {
    return this._httpClient.get(`/api/p/${provinceId}?depth=2`);
  }

  getWards(districtId: string): Observable<any> {
    return this._httpClient.get(`/api/d/${districtId}?depth=2`);
  }

  /**
   * Get rows
   */
  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/branch`)
        .pipe(
          map((response: any) => {
            if (response && response.data) {
              return response.data;
            } else {
              return [];
            }
          }),
          catchError((error) => {
            console.error("Error fetching branch data:", error);
            return [];
          })
        )
        .subscribe((data: any[]) => {
          this.rows = data;
          this.onBranchListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }

  createBranch(branchData: Branch): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/branch`, branchData)
      .pipe(
        map((response: any) => {
          console.log("Branch created successfully:", response);
          return response;
        }),
        catchError((error) => {
          console.error("Error creating branch:", error);
          throw error;
        })
      );
  }

  updateBranch(branchId: number, branchData: Branch): Observable<any> {
    return this._httpClient
      .put(`${environment.apiUrl}/branch/${branchId}`, branchData)
      .pipe(
        map((response: any) => {
          console.log("Branch updated successfully:", response);
          return response;
        }),
        catchError((error) => {
          console.error("Error creating branch:", error);
          throw error;
        })
      );
  }

  deleteBranch(branchIds: number[]): Observable<any> {
    const options = {
      headers: { 'Content-Type': 'application/json' },
      body: { ids: branchIds }  // Đẩy dữ liệu ids vào body của yêu cầu DELETE
    };

    return this._httpClient
      .delete(`${environment.apiUrl}/branch`, options)
      .pipe(
        map((response: any) => {
          console.log("Branch deleted successfully:", response);
          return response;
        }),
        catchError((error) => {
          console.error("Error deleting branch:", error);
          throw error;
        })
      );
  }
}
