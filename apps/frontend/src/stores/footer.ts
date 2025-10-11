import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

export const useFooterStore = defineStore('footer', () =>
{

  const [height, setHeight] = useState(100)
  const [siteYear, setSiteYear] = useState(new Date().getFullYear())
  const [icp, setIcp] = useState('粤ICP备2025000000号')
  const [author, setAuthor] = useState('Eric Hu')
  const [timestamp, setTimestamp] = useState(new Date().getTime())

  const interval = setInterval(() =>
  {
    setTimestamp(new Date().getTime())
  }, 1000)

  return {
    height,
    siteYear,
    icp,
    author,
    timestamp,
    setHeight,
    setSiteYear,
    setIcp,
    setAuthor
  }
})