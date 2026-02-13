import { defineStore } from 'pinia'
import { useState } from '@u-blog/composables'
import { getRandomImage } from '@u-blog/model'

export const useHeroStore = defineStore('hero', () =>
{
  const [top, setTop] = useState(-100)
  const [title, setTitle] = useState('博客')
  const [desc, setDesc] = useState('欢迎来到这里')
  const [gap, setGap] = useState(20)
  const [img, setImg] = useState(getRandomImage())
  const [titleStyles, setTitleStyles] = useState({
    fontSize: 50,
    fontWeight: 600,
    maxWidth: 600,
    marginTop: -120
  })
  const [descStyles, setDescStyles] = useState({
    fontSize: 20,
    fontWeight: 400,
    maxWidth: 1200
  })

  return {
    top,
    title,
    desc,
    gap,
    img,
    titleStyles,
    descStyles,
    
    setTop,
    setTitle,
    setDesc,
    setGap,
    setImg,
    setTitleStyles,
    setDescStyles
  }
})