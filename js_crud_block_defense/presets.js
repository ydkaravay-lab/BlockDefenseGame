const STORAGE_KEY = "tetris_defense_presets";
export const DEFAULT_PRESET = Object.freeze({
    name: "Обычный",
    dropInterval: 1000,
    spawnInterval: 500,
    durability: 1,
});
export class PresetStore {
    validate(preset) {
        if (!preset || typeof preset !== "object") {
            throw new Error("Некорректный пресет.");
        }
        const name = typeof preset.name === "string"
            ? preset.name.trim()
            : "";
        if (!name || name.length > 50) {
            throw new Error("Название должно содержать от 1 до 50 символов.");
        }
        if (
            !Number.isInteger(preset.dropInterval) ||
            preset.dropInterval < 100 ||
            preset.dropInterval > 10000
        ) {
            throw new Error("Интервал падения: от 100 до 10000 мс.");
        }
        if (
            !Number.isInteger(preset.spawnInterval) ||
            preset.spawnInterval < 0 ||
            preset.spawnInterval > 10000
        ) {
            throw new Error("Интервал спавна: от 0 до 10000 мс.");
        }
        if (
            !Number.isInteger(preset.durability) ||
            preset.durability < 1 ||
            preset.durability > 20
        ) {
            throw new Error("Прочность: от 1 до 20 выстрелов.");
        }
        return {
            name,
            dropInterval: preset.dropInterval,
            spawnInterval: preset.spawnInterval,
            durability: preset.durability,
        };
    }
    getAll() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) {
            return [];
        }
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error(
                "Данные пресетов в localStorage повреждены."
            );
        }
        if (!Array.isArray(data)) {
            throw new Error("Некорректный формат списка пресетов.");
        }
        return data.map(item => this.validate(item));
    }
    saveAll(presets) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    }
    create(preset) {
        const validated = this.validate(preset);
        const presets = this.getAll();
        if (presets.some(item => item.name === validated.name)) {
            throw new Error("Пресет с таким названием уже существует.");
        }
        presets.push(validated);
        this.saveAll(presets);
    }
    update(oldName, preset) {
        const validated = this.validate(preset);
        const presets = this.getAll();
        const index = presets.findIndex(item => item.name === oldName);
        if (index === -1) {
            throw new Error("Пресет не найден.");
        }
        if (
            presets.some(
                (item, i) => i !== index && item.name === validated.name
            )
        ) {
            throw new Error("Пресет с таким названием уже существует.");
        }
        presets[index] = validated;
        this.saveAll(presets);
    }
    delete(name) {
        const presets = this.getAll();
        const filtered = presets.filter(item => item.name !== name);
        if (filtered.length === presets.length) {
            throw new Error("Пресет не найден.");
        }
        this.saveAll(filtered);
    }
}