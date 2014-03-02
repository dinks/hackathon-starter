module.exports = {
  variants: {
    book: {
      // keepNames: true,
      resize: {
        mini : '300x200',
        preview: '800x600',
        thumb : '128X128'
      }
    },
    gallery: {
      crop: {
        thumb: '100x100'
      }
    }
  },
  storage: {
    Local: {
      path: 'public/uploads/',
      mode: 0777
    }
  },
  debug: true
}
