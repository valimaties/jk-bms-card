import {HomeAssistant} from 'custom-card-helpers';
import {EntityKey} from '../const';
import {JkBmsCardConfig} from '../interfaces';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fireEvent(node: HTMLElement, type: string, detail: any, options?: any) {
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new Event(type, {
        bubbles: options.bubbles === undefined ? true : options.bubbles,
        cancelable: Boolean(options.cancelable),
        composed: options.composed === undefined ? true : options.composed,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event as any).detail = detail;
    node.dispatchEvent(event);
    return event;
}

export const configOrEnum = (config: JkBmsCardConfig, entityId: EntityKey) => {
    const configValue = config?.entities[entityId]?.toString()?.trim();
    return configValue && configValue.length > 1 ? configValue : entityId?.toString();
}

export const navigate = (event, config: JkBmsCardConfig, entityId: EntityKey, type: "sensor" | "switch" | "number" | "binary_sensor" = "sensor") => {
    if (!event) {
        return;
    }

    event.stopPropagation();

    const configValue = configOrEnum(config, entityId);
    const fullEntityId = configValue.includes('sensor.') || configValue.includes('switch.') || configValue.includes('number.') || configValue.includes('binary_sensor.') ? configValue : type + "." + config?.prefix + "_" + configValue;
    let customEvent = new CustomEvent('hass-more-info', {
        detail: {entityId: fullEntityId},
        composed: true,
    })
    event.target.dispatchEvent(customEvent);
}

const resolveEntity = (
    hass: HomeAssistant,
    config: JkBmsCardConfig,
    entityKey: EntityKey,
    type: "sensor" | "switch" | "number" | "binary_sensor" = "sensor"
) => {
    const configValue = configOrEnum(config, entityKey);
    if (!configValue) return null;

    const entityId = configValue.includes('.')
        ? configValue
        : `${type}.${config!.prefix}_${configValue}`;

    return hass?.states[entityId] ?? null;
};

export const getState = (hass: HomeAssistant, config: JkBmsCardConfig, entityKey: EntityKey, precision: number = 2, defaultValue = '', type: "sensor" | "switch" | "number" | "binary_sensor" = "sensor"): string => {
    const entity = resolveEntity(hass, config, entityKey, type);
    if (!entity) return defaultValue;

    const state = entity.state;
    const numeric = Number(state);

    if (!isNaN(numeric))
        return numeric.toFixed(precision);

    return state ?? defaultValue;
}

export const getUnit = ( hass: HomeAssistant, config: JkBmsCardConfig, entityKey: EntityKey, type: "sensor" | "switch" | "number" | "binary_sensor" = "sensor"): string => {
    const entity = resolveEntity(hass, config, entityKey, type);
    return entity?.attributes?.unit_of_measurement ?? '';
};

// This is a more generic factor conversion function
type UnitType = 'V' | 'mV' | 'Ω' | 'mΩ'; // this could be extended to any other measure types, but should be added also in UNIT_CONFIG

const normalizeUnit = (unit: string | null | undefined): UnitType | null => {
    if (!unit) return null;

    const u = unit.trim().toLowerCase();

    switch (u) {
        case 'v': return 'V';
        case 'mv': return 'mV';

        case 'ω':
        case 'ohm':
        case 'ohms':
            return 'Ω';

        case 'mω':
        case 'mohm':
        case 'mohms':
            return 'mΩ';

        default:
            return null;
    }
};

const UNIT_CONFIG: Record<UnitType, { toBase: number }> = {
    V:  { toBase: 1 },
    mV: { toBase: 0.001 },

    Ω:  { toBase: 1 },
    mΩ: { toBase: 0.001 }
};

export const formatValue = (
    inputUnitRaw: string | null | undefined,
    outputUnitRaw: string | null | undefined,
    value: number | string
): string => {

    const numeric = typeof value === 'string'
        ? parseFloat(value)
        : value;

    if (isNaN(numeric)) return '-';

    const inputUnit = normalizeUnit(inputUnitRaw);
    const outputUnit = normalizeUnit(outputUnitRaw);

    // fallback safe
    if (!inputUnit || !outputUnit) {
        return `${numeric} ${outputUnitRaw ?? ''}`.trim();
    }

    // conversion: input → bază → output
    const baseValue = numeric * UNIT_CONFIG[inputUnit].toBase;
    const finalValue = baseValue / UNIT_CONFIG[outputUnit].toBase;

    const decimals = outputUnit.startsWith('m') ? 0 : 3;

    const formatted = finalValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return `${formatted} ${outputUnit}`;
};