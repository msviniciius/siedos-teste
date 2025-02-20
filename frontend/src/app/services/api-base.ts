import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';

@Injectable()
export abstract class ApiBase {
  protected abstract routePath: string;
  protected apiBaseUrl: string;
  protected version: string = "";
  protected scope: string;

  constructor(protected httpClient: HttpClient) {
    this.apiBaseUrl = 'http://localhost:3000/v1';
  }

  protected get<TResult>(path: string, options?: ApiBase.Options): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      const url = this.buildURL(path);
  
      options = this.prepareOptions(options);
  
      return this.httpClient.get<TResult>(url, options)
        .subscribe(
          result => resolve(result),
          error => this.errorHandler(error, reject));
    });
  }

  protected post<TResult>(path: string, content?: any, options?: ApiBase.Options): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      const url = this.buildURL(path);

      options = this.prepareOptions(options);

      this.httpClient.post<TResult>(url, content, options)
        .subscribe(
          result => resolve(result),
          error => this.errorHandler(error, reject));
    });
  }

  protected patch<TResult>(path: string, content?: any, options?: ApiBase.Options): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      const url = this.buildURL(path);

      options = this.prepareOptions(options);

      this.httpClient.patch<TResult>(url, content, options)
        .subscribe(
          result => resolve(result),
          error => this.errorHandler(error, reject));
    });
  }

  protected put<TResult>(path: string, content?: any, options?: ApiBase.Options): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      const url = this.buildURL(path);

      options = this.prepareOptions(options);

      this.httpClient.put<TResult>(url, content, options)
        .subscribe(
          result => resolve(result),
          error => this.errorHandler(error, reject));
    });
  }

  protected postOrPutWithAttachments<TResult>(path: string, content?: any, options?: ApiBase.Options): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      const url = this.buildURL(path);
  
      let body: any;
      if (content instanceof FormData) {
        body = content;
      } else {
        body = this.objectToFormData(content);
      }
  
      options = this.prepareOptions(options);
  
      this.httpClient.put<TResult>(url, body, options)
        .subscribe(
          result => resolve(result),
          error => this.errorHandler(error, reject)
        );
    });
  }

  private objectToFormData(obj: any, form?: FormData, namespace?: string): FormData {
    const formData = form || new FormData();
  
    for (const property in obj) {
      if (obj.hasOwnProperty(property)) {
        const formKey = namespace ? `${namespace}[${property}]` : property;
  
        if (obj[property] instanceof Date) {
          formData.append(formKey, obj[property].toISOString());
        } else if (obj[property] instanceof Array) {
          obj[property].forEach((item, index) => {
            this.objectToFormData(item, formData, `${formKey}[${index}]`);
          });
        } else if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
          this.objectToFormData(obj[property], formData, formKey);
        } else {
          formData.append(formKey, obj[property]);
        }
      }
    }
  
    return formData;
  }

  protected delete<TResult>(path: string, content?: any, options?: ApiBase.Options): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      const url = this.buildURL(path);

      options = this.prepareOptions(options);

      if (content) {
        (options as any).body = content;
      }

      this.httpClient.delete<TResult>(url, options)
        .subscribe(
          result => resolve(result),
          error => this.errorHandler(error, reject));
    });
  }

  private errorHandler(error: any, onError: (reason: any) => void): void {
    if (onError) {
      let errorMessage = new ApiBase.ErrorMessage();

      if (error instanceof HttpErrorResponse) {
        let err = error.error;
        if (err && typeof err === "string") {
          err = JSON.parse(err);
        }

        errorMessage = Object.assign<ApiBase.ErrorMessage, ApiBase.ErrorMessage>(errorMessage, err);
      }
      else {
        errorMessage.message = JSON.stringify(error);
      }

      onError(errorMessage);
    }
  }

  protected buildHeader(authToken?: string): { [header: string]: string | string[] } {
    const headers: { [header: string]: string | string[] } = {
      'Accept-Language': 'pt-BR'
    };
  
    if (authToken) {
      headers['Authorization'] = authToken;
    }
  
    return headers;
  }

  private prepareOptions(options?: ApiBase.Options): ApiBase.Options {
    if (!options) {
      options = {};
    }
  
    // Prepare headers
    options.headers = options.headers || {};
    
    if (options.headers instanceof HttpHeaders) {
      options.headers = options.headers.set('Authorization', 'Bearer ' + (options.headers.get('Authorization') || ''));
    } else if (typeof options.headers === 'object') {
      options.headers = Object.assign(this.buildHeader(), options.headers);
    } else {
      options.headers = this.buildHeader();
    }
  
    return options;
  }

  protected buildURL(path: string): string {
    let url = this.apiBaseUrl;

    if (!url.endsWith("/")) {
      url += "/";
    }

    url += this.version;

    if (!url.endsWith("/")) {
      url += "/";
    }

    url += this.routePath;

    if (!path) {
      return url;
    }

    if (!url.endsWith("/") && !path.startsWith("/")) {
      url += "/";
    }

    return url + path;
  }
}

export namespace ApiBase {
  export type Options = {
    headers?: HttpHeaders | {
      [header: string]: string | string[];
    };
    observe?: 'body';
    params?: HttpParams | {
      [param: string]: string | string[];
    };
    reportProgress?: boolean;
    withCredentials?: boolean;
  };

  export class ErrorMessage {
    public message: string;
    public error: string;
    public invalidField: string;
  }

  export class EmployeContact {
    phone: string;
    cell_phone: string;
    email: string;
    id: number;
  }

  export class EmployeDocument {
    filename: string;
    content_type: string;
    byte_size: number;
  }

  export class ListViewModelEmployee<TItem> {
    id: number;
    name: string;
    registration: string;
    birthday: Date;
    municipality: string;
    gender: any;
    employee_complement: []
    state: string;
    // marital_state_id: number;
    // workspace_id: number;
    // job_role_id: number;
    marital_state: any;
    job_role: any;
    workspace: any;
    contacts: EmployeContact[];
    document_upload: any;
  }  
  
  export class ListViewModelNotification<TItem> {
    id: number;
    title: string;
    message: string;
  }  
  
  export class ListViewModelUser<TItem> {
    id: number;
    email: string;
    role: string;
  }

  export class ListViewModel<TItem> {
		public count: number;
    public total_pages: number;
    public total: number;
    public first: boolean;
    public last: boolean;
    public number: number;
    public numberOfElements: number;
    public size: number;
    public empty: boolean;
		public items: TItem[];
	}

  export class Sort {
    public sorted: boolean;
    public unsorted: false;
    public empty: boolean;
  }
}
