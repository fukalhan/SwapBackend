export class DataResponse<S, T> {
  constructor(
    public success: boolean,
    public flag: S,
    public data: T | null = null) {}
}

export class Response<S> {
  constructor(public success: boolean, public flag: S) {}
}

export enum ResponseFlag {
    SUCCESS = 0,
    FAIL = 1
}
