const NoopWorker = function (this: any) {
  this.postMessage = () => {}
  this.addEventListener = () => {}
  this.terminate = () => {}
} as unknown as { new (): Worker }
export default NoopWorker
