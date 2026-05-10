import Utils from "../utils";

export default async function loadAssets(
  assets: Array<HTMLImageElement | HTMLAudioElement>
) {
  let promises = [];
  const loadedAssets = [] as (HTMLImageElement | HTMLAudioElement)[];
  for (let i = 0, l = assets.length; i < l; i++) {
    promises.push(
      Utils.loadAsset(assets[i]).then(
        (assetData: HTMLImageElement | HTMLAudioElement) =>
          loadedAssets.push(assetData)
      )
    );
  }

  await Promise.all(promises);
  return loadedAssets;
}
