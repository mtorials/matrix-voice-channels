import { MatrixClient } from "./msdk";
import config from "../../config"
import * as sdk from "matrix-js-sdk";

export default class MatrixIndex {
  createClient() : MatrixClient {
    return sdk.createClient({
      baseUrl: "/",
      accessToken: config.token,
      userId: config.username
    })
  }
}