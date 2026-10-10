import { Button } from '@yelison/forma-ui'
import { useCallback, useId, useMemo, useReducer, useState } from 'react'
import { useIntl } from 'react-intl'
import { CodeBlock } from '../CodeBlock'
import { codeLines } from './codeLines'
import styles from './ComponentExplorer.module.css'
import { ControlSelect } from './ControlSelect'
import {
  componentDefinitions,
  definitionOf,
  type ComponentName,
  type Control,
  type ControlOption,
  type Translate,
} from './definitions'
import { explorerReducer, initialExplorerState } from './explorerState'
import { formatJsx } from './formatJsx'
import { optionLabel } from './optionLabel'
import { SpecimenView } from './SpecimenView'

/**
 * The homepage explorer: pick a component, change its props, and see the real component beside the JSX that renders
 * it. Both come from one specimen, so the code is never a description of something else.
 *
 * What a change does is told to a screen reader in a polite live region, from the handlers of the change: the region
 * stays empty on load and on a change of language, and the code itself is never read out, which would be too long. An
 * announcement is kept with the language it was written in and is not shown in another: after a change of language the
 * region is empty again, not in the voice of the old language.
 */
export function ComponentExplorer() {
  const intl = useIntl()
  const [state, dispatch] = useReducer(explorerReducer, initialExplorerState)
  const [announcement, setAnnouncement] = useState<{ text: string; locale: string }>()
  const headingId = useId()
  const selectorName = useId()

  const definition = definitionOf(state.component)
  const translate = useCallback<Translate>((id) => intl.formatMessage({ id }), [intl])
  const specimen = definition.specimen(state.values, translate)
  const code = formatJsx(specimen)
  const reservedLines = useMemo(() => codeLines(definition, translate), [definition, translate])

  const announce = (text: string) => setAnnouncement({ text, locale: intl.locale })

  function selectComponent(component: ComponentName) {
    dispatch({ type: 'selectComponent', component })
    announce(intl.formatMessage({ id: 'explorer.announce.component' }, { component }))
  }

  function setControl(control: Control, option: ControlOption) {
    dispatch({ type: 'setControl', control: control.id, value: option.value })
    announce(
      intl.formatMessage(
        { id: 'explorer.announce.control' },
        { control: intl.formatMessage({ id: control.label }), value: optionLabel(intl, option) },
      ),
    )
  }

  function reset() {
    dispatch({ type: 'reset' })
    announce(intl.formatMessage({ id: 'explorer.announce.reset' }))
  }

  return (
    <section className={styles.explorer} aria-labelledby={headingId}>
      <h2 id={headingId} className="forma-visually-hidden">
        {intl.formatMessage({ id: 'explorer.heading' })}
      </h2>

      {/* Radios, not tabs: choosing a component changes what the rest shows, and a native group brings the arrow keys. */}
      <fieldset className={styles.selector}>
        <legend className="forma-visually-hidden">{intl.formatMessage({ id: 'explorer.component.legend' })}</legend>
        {componentDefinitions.map(({ name }) => (
          <label key={name} className={styles.choice}>
            <input
              type="radio"
              className="forma-visually-hidden"
              name={selectorName}
              value={name}
              checked={state.component === name}
              onChange={() => selectComponent(name)}
            />
            <span className={styles.choiceName}>{name}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.workbench}>
        <div
          className={styles.stage}
          role="group"
          aria-label={intl.formatMessage({ id: 'explorer.preview.label' }, { component: state.component })}
        >
          {/* Keyed by its code: a specimen that changes starts over, with the value its props give it. */}
          <div
            className={
              specimen.component === 'Input' || specimen.component === 'Tabs' ? styles.fittedSpecimen : styles.specimen
            }
          >
            <SpecimenView key={code} specimen={specimen} />
          </div>
        </div>
        <CodeBlock
          code={code}
          label={intl.formatMessage({ id: 'explorer.code.label' }, { component: state.component })}
          minLines={reservedLines}
        />
      </div>

      <fieldset className={styles.controls}>
        <legend className="forma-visually-hidden">{intl.formatMessage({ id: 'explorer.controls.legend' })}</legend>
        {definition.controls.map((control) => (
          <ControlSelect
            key={`${state.component}-${control.id}`}
            control={control}
            value={state.values[control.id] ?? ''}
            onChange={(option) => setControl(control, option)}
          />
        ))}
        {/* Always enabled: a button that disables itself when it is pressed would drop the focus on the page. */}
        <Button variant="secondary" className={styles.reset} onClick={reset}>
          {intl.formatMessage({ id: 'explorer.reset' })}
        </Button>
      </fieldset>

      <p role="status" className="forma-visually-hidden">
        {announcement?.locale === intl.locale ? announcement.text : ''}
      </p>
    </section>
  )
}
