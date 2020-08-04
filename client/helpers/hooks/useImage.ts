const imageCache: {[key: string]: any} = {};

const useImage = (url: string) => {
  if (!imageCache[url]) {
    const image = new Image();
    const promise = new Promise(resolve => {
      image.addEventListener("load", () => resolve(image));
      image.crossOrigin = "anonymous";
      image.src = url;
    }).then(res => {
      imageCache[url] = res;
    });
    imageCache[url] = promise;
  }
  if (imageCache[url].then) {
    throw imageCache[url];
  }
  return imageCache[url];
};

export default useImage;
