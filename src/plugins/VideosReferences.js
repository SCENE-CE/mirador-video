export const VideosReferences = {
  /** */
  get(windowId) {
    return this.refs[windowId];
  },
  refs: {},
  /** */
  set(windowId, ref) {
    this.refs[windowId] = ref;
  },
};
