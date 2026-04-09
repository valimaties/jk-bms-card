import { HomeAssistant, LovelaceCardEditor, LovelaceConfig } from 'custom-card-helpers';
import { html, LitElement, TemplateResult } from 'lit';
import { EDITOR_NAME, EntityKey } from './const';
import { customElement, property, state } from 'lit/decorators.js';
import { JkBmsCardConfig } from './interfaces';
import { localize } from './localize/localize';
import { fireEvent } from './helpers/utils';

@customElement(EDITOR_NAME)
export class JkBmsCardEditor extends LitElement implements LovelaceCardEditor {
    @property() public hass!: HomeAssistant;
    @property() private _config!: JkBmsCardConfig;
    @property() lovelace?: LovelaceConfig;

    @state() private _dynamicEntitySchema: any[] = [];

    // Lista cu toate entitățile fixe (care nu depind de cellCount)
    private readonly _fixedEntities = Object.values(EntityKey).filter(key => 
        !key.startsWith('cell_voltage_') && 
        !key.startsWith('cell_resistance_')
    );

    public setConfig(config: JkBmsCardConfig): void {
        this._config = { ...config };
        this._updateDynamicEntitySchema();
    }

    private _updateDynamicEntitySchema(): void {
        const cellCount = Math.min(this._config?.cellCount ?? 16, 96);

        const dynamic: any[] = [];

        // Cell Voltages 1 → cellCount
        for (let i = 1; i <= cellCount; i++) {
            const key = `cell_voltage_${i}`;
            if (key in EntityKey) {
                dynamic.push({
                    name: key,
                    selector: { entity: {} }
                });
            }
        }

        // Cell Resistances 1 → cellCount
        for (let i = 1; i <= cellCount; i++) {
            const key = `cell_resistance_${i}`;
            if (key in EntityKey) {
                dynamic.push({
                    name: key,
                    selector: { entity: {} }
                });
            }
        }

        this._dynamicEntitySchema = dynamic;
    }

    protected willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
        super.willUpdate(changedProperties);

        if (changedProperties.has('_config')) {
            const oldConfig = changedProperties.get('_config') as JkBmsCardConfig | undefined;
            if (oldConfig?.cellCount !== this._config?.cellCount) {
                this._updateDynamicEntitySchema();
            }
        }
    }

    protected render(): TemplateResult | void {
        if (!this._config || !this.hass) {
            return html``;
        }

        const entityConfigs = [
            ...this._fixedEntities.map(key => ({
                name: key,
                selector: { entity: {} }
            })),
            ...this._dynamicEntitySchema
        ];

        return html`
			<ha-form
				.hass=${this.hass}
				.data=${this._config}
				.computeLabel=${this._computeLabelCallback.bind(this)}
				.schema=${[
                {
                    type: 'grid',
                    title: localize('config.title'),
                    schema: [
                        {
                            type: 'grid',
                            schema: [
                                { name: 'title', selector: { text: {} } },
                            ],
                        },
                    ],
                },
                {
                    type: 'grid',
                    title: localize('config.language'),
                    schema: [
                        {
                            type: 'grid',
                            schema: [
                                {
                                name: 'language',
                                selector: {
                                    select: {
                                    options: [
                                        { label: 'Auto (follow HA)', value: 'auto' },
                                        { label: 'English',          value: 'en' },
                                        { label: 'Română',           value: 'ro' },
                                        { label: 'Українська',       value: 'uk' },
                                        { label: 'German',           value: 'de' },
										{ label: 'Русский',			 value: 'ru' },
										{ label: 'Polski',            value: 'pl' },
    									{ label: 'Français',          value: 'fr' },
    									{ label: 'Español',           value: 'es' },
    									{ label: '中文',               value: 'zh' }
                                    ],
                                    mode: 'dropdown',
                                    }
                                }
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'grid',
                    title: localize('config.prefix'),
                    schema: [
                        {
                            type: 'grid',
                            schema: [
                                { name: 'prefix', selector: { text: {} } },
                            ],
                        },
                    ],
                },
                {
                    type: 'grid',
                    title: localize('config.layout'),
                    schema: [
                        {
                            type: 'grid',
                            schema: [
                                {
                                    name: 'layout',
                                    selector: {
                                        select: {
                                            options: [
                                                { label: 'Default', value: 'default' },
                                                { label: 'Core Reactor', value: 'core-reactor' }
                                            ]
                                        }
                                    }
                                },
                                {
                                    name: 'deltaVoltageUnit',
                                    selector: {
                                        select: {
                                            options: [
                                                { label: 'Volts (V)', value: 'V' },
                                                { label: 'Millivolts (mV)', value: 'mV' }
                                            ]
                                        }
                                    }
                                },
                                { name: 'minCellVoltage', selector: { number: { min: 2.0, max: 4.0, step: 0.01, mode: 'box' } } },
                                
                            ],
                        },
                        {
                            type: 'grid',
                            column_min_width: '200px',
                            schema: [
                                {
                                    name: 'cellColorMode',
                                    selector: {
                                        select: {
                                            options: [
                                                { label: 'Progress Bar', value: 'progress' },
                                                { label: 'Voltage Gradient', value: 'gradient' }
                                            ]
                                        }
                                    }
                                },
                                {
                                    name: 'cellOrientation',
                                    selector: {
                                        select: {
                                            options: [
                                                { label: 'Vertical', value: 'vertical' },
                                                { label: 'Horizontal', value: 'horizontal' }
                                            ]
                                        }
                                    }
                                },
                                { name: 'maxCellVoltage', selector: { number: { min: 2.0, max: 4.0, step: 0.01, mode: 'box' } } },
                            ],
                        },
                    ],
                },
                {
                    type: 'grid',
                    title: localize('config.cellCount'),
                    schema: [
                        {
                            type: 'grid',
                            schema: [
                                { name: 'cellCount', selector: { number: { min: 2, max: 48, step: 2 } } },
                                { name: 'cellColumns', selector: { number: { min: 1, max: 8, step: 1 } } }
                            ]
                        },
                    ],
                },
                {
                    type: 'grid',
                    schema: [
                        {
                            name: 'cellLayout', selector: {
                                select: {
                                    options: [
                                        { label: 'Incremental', value: 'incremental' },
                                        { label: 'Bank Mode', value: 'bankMode' },
                                    ]
                                }
                            }
                        },
                        {
                            name: 'socDecimals', 
                            title: localize('config.socDecimals'), 
                            selector: { number: { min: 0, max: 2, step: 1 } }
                        },
                    ],
                },
                {
                    type: 'grid',
                    title: localize('config.tempSensorsCount'),
                    schema: [
                        {
                            type: 'grid',
                            schema: [
                                { name: 'tempSensorsCount', selector: { number: { min: 0, max: 4, step: 2 } } },
                                {
                                    name: 'customDecimals', 
                                    title: localize('config.customDecimals'),
                                    selector: { number: { min: 0, max: 2, step: 1 } }
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'grid',
                    title: localize('config.hasHeater'),
                    schema: [
                        {
                            type: 'grid',
                            schema: [
                                {
                                    name: 'hasHeater', selector: {
                                        select: {
                                            multiple: false, mode: "list", options: [
                                                { label: "Yes", value: "1" },
                                                { label: "No", value: "0" }
                                            ]
                                        }
                                    }
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'grid',
                    title: 'showHideZones',
                    column_min_width: '80px',
                    schema: [
                        {
                            name: 'showTitle',
                            selector: { boolean: {} },
                        },
                        {
                            name: 'showButtons',
                            selector: { boolean: {} },
                        },
                        {
                            name: 'showMain',
                            selector: { boolean: {} },
                        },
                        {
                            name: 'showCells',
                            selector: { boolean: {} },
                        },
                        {
                            name: 'showCardVersion',
                            selector: { boolean: {} },
                        },
                    ],
                },
                {
                    type: 'expandable',
                    title: localize('config.manualAssignment'),
                    schema: [
                        {
                            name: 'entities',
                            type: 'grid',
                            schema: entityConfigs,
                        },
                    ],
                },
            ]}
				@value-changed=${this._valueChanged.bind(this)}
			></ha-form>
		`;
    }
    private _computeLabelCallback = (data) => localize(`config.${data.name}`) ?? data.name;
    
    private _valueChanged(ev: CustomEvent): void {
        const config = { ...this._config };           // copy
        Object.assign(config, ev.detail.value);       // merge shallow

        this._config = config;

        if ('cellCount' in ev.detail.value) {
            this._updateDynamicEntitySchema();
        }

        fireEvent(this, 'config-changed', { config: this._config });
    }
}
