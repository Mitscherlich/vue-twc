import { forwardRef } from '@m9ch/vue-forward-ref'
import { h } from 'vue-demi'

function filterProps(
  props: Record<string, any>,
  shouldForwardProp: (prop: string) => boolean,
) {
  const filteredProps: Record<string, any> = {}
  const keys = Object.keys(props)
  for (let i = 0; i < keys.length; i++) {
    const prop = keys[i]
    if (shouldForwardProp(prop))
      filteredProps[prop] = props[prop]
  }
  return filteredProps
}

type Attributes = Record<string, any> | ((props: any) => Record<string, any>)

interface Options {
  /**
   * The function to use to determine if a prop should be forwarded to the
   * underlying component. Defaults to `prop => prop[0] !== "$"`.
   */
  shouldForwardProp?: (prop: string) => boolean
}

export function createTwc(opts: Options = {}) {
  const defaultShouldForwardProp = opts.shouldForwardProp || (prop => prop[0] !== '$')
  const wrap = (component: any) => {
    const createTemplate = (
      attrs?: Attributes,
      shouldForwardProp = defaultShouldForwardProp,
    ) => {
      const template: any = (
        stringsOrFn: TemplateStringsArray | Function,
        ...values: any[]
      ) => {
        const isClassFn = typeof stringsOrFn === 'function'
        const tplClassName = !isClassFn && String.raw({ raw: stringsOrFn }, ...values)
        return forwardRef((p: any, { slots }, ref) => {
          const rp = typeof attrs === 'function' ? attrs(p) : attrs ?? {}
          const fp = filterProps({ ...rp, ...p }, shouldForwardProp)
          const cn = isClassFn ? stringsOrFn(p) : tplClassName
          return h(component, {
            ref,
            class: typeof cn === 'function' ? cn(p) : cn,
            ...fp,
          }, slots)
        })
      }

      if (attrs == null)
        template.attrs = (attrs: Attributes) => createTemplate(attrs)

      return template
    }

    return createTemplate()
  }

  return new Proxy(
    (component: any) => {
      return wrap(component)
    },
    {
      get: (_, name) => {
        return wrap(name)
      },
    },
  )
}

// TODO: typings later. its really hard
export const twc: any = createTwc()
