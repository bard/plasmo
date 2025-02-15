import { vLog } from "@plasmo/utils/logging"

import { runtimeData, triggerReload } from "./0-patch-module"
import { injectHmrSocket } from "./hmr"
import { hmrAcceptCheck, hmrState, resetHmrState } from "./hmr-check"
import { hmrAcceptRun, hmrApplyUpdates } from "./hmr-utils"
import { injectReactRefresh } from "./react-refresh"

const parent = module.bundle.parent

if (!parent || !parent.isParcelRequire) {
  vLog("Injecting HMR socket")
  injectHmrSocket(async (updatedAssets) => {
    if (runtimeData.isReact) {
      resetHmrState()
      // Is an extension page, can try to hot reload
      const assets = updatedAssets.filter(
        (asset) => asset.envHash === runtimeData.envHash
      )

      const canHmr = assets.every(
        (asset) =>
          asset.type === "css" ||
          (asset.type === "js" &&
            hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle))
      )

      if (canHmr) {
        if (
          typeof globalThis.window !== "undefined" &&
          typeof CustomEvent !== "undefined"
        ) {
          window.dispatchEvent(new CustomEvent("parcelhmraccept"))
        }

        await hmrApplyUpdates(assets)

        for (const [asset, id] of hmrState.assetsToAccept) {
          if (!hmrState.acceptedAssets[id]) {
            hmrAcceptRun(asset, id)
          }
        }
      }
    } else {
      await triggerReload()
    }
  })
}

if (runtimeData.isReact) {
  vLog("Injecting react refresh")
  injectReactRefresh()
}
