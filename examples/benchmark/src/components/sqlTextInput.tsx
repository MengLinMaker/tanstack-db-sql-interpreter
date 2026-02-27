import { indentWithTab } from '@codemirror/commands'
import { sql } from '@codemirror/lang-sql'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { createEffect, onCleanup, onMount } from 'solid-js'
import { schema } from '../schema/collections'

export default function SqlTextInput(props: {
  value?: string
  onChange?: (value: string) => void
  class?: string
}) {
  let host: HTMLDivElement | undefined
  let view: EditorView | undefined

  const className = () =>
    props.class ? `sql-input ${props.class}` : 'sql-input'

  onMount(() => {
    const extensions = [
      basicSetup,
      sql({ schema }),
      keymap.of([indentWithTab]),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return
        props.onChange?.(update.state.doc.toString())
      }),
    ]

    view = new EditorView({
      parent: host!,
      doc: props.value ?? '',
      extensions,
    })
  })

  createEffect(() => {
    if (!view) return
    if (props.value === undefined) return
    const current = view.state.doc.toString()
    if (props.value === current) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: props.value },
    })
  })

  onCleanup(() => {
    view?.destroy()
  })

  return <div ref={host} class={className()} />
}
