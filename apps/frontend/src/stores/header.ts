import { defineStore } from 'pinia'
import { faker } from '@faker-js/faker'
import { useState } from '@u-blog/composables'
import { getRandomImage } from '@u-blog/model'

export const useHeaderStore = defineStore('header', () =>
{
  
  const [height, setHeight] = useState(0)
  const [logo, setLogo] = useState(getRandomImage())
  const [name, setName] = useState(faker.person.fullName())
  const [leftWidth, setLeftWidth] = useState(3)

  return {
    logo,
    name,
    leftWidth,
    height,

    setHeight,
    setLogo,
    setName,
    setLeftWidth
  }
})