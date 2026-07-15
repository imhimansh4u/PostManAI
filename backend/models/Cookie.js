import mongoose from "mongoose";

const CookieSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: { type: String, required: true },
    value: { type: String, required: true },
    domain: { type: String, default: null },
    path: { type: String, default: "/" }, // // KNOWN LIMITATION: Path defaults to "/" instead of computing RFC 6265 default-path // (directory of the issuing request URL). Correct for shallow routes like /login,//incorrect for nested routes like /v1/cart/add (should default to /v1/cart).// Deferred: acceptable for current portfolio scope, revisit if testing deep-nested APIs.
    httpOnly: { type: Boolean, default: false },
    secure: { type: Boolean, default: false },
    sameSite: {
      type: String,
      enum: ["Lax", "Strict", "None", null],
      default: null,
    },
    expires: { type: Date, default: null },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

CookieSchema.virtual("isPersistent").get(function () {
  return !!this.expires;
});

CookieSchema.index(
  { projectId: 1, name: 1, domain: 1, path: 1 },
  { unique: true },
);
CookieSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Cookie", CookieSchema);

/******
 * HttpOnly doesn't generically mean "JS can't touch this cookie." It specifically means: document.cookie
 *  (a browser DOM API) will not include this cookie in its output, and cannot be used to set/modify it either.
 *  That's the exact mechanism — it's a restriction on one specific API surface (document.cookie),
 *  enforced by the browser's JavaScript engine, inside a page's execution context.
 */
