export interface SliderConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

export function createSlider(container: HTMLElement, config: SliderConfig): HTMLInputElement {
  const { label, min, max, step, value, onChange } = config;

  const decimals = step < 1 ? (step.toString().split('.')[1]?.length ?? 0) : 0;
  const format = config.format ?? ((v: number) => v.toFixed(decimals));

  const wrapper = document.createElement('div');
  wrapper.style.marginBottom = '10px';

  const labelEl = document.createElement('div');
  labelEl.textContent = label;
  labelEl.style.marginBottom = '5px';
  labelEl.style.fontWeight = 'bold';
  labelEl.style.fontSize = '14px';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step.toString();
  slider.value = value.toString();
  slider.style.width = '100%';
  slider.style.marginBottom = '2px';

  const valueEl = document.createElement('div');
  valueEl.textContent = format(value);
  valueEl.style.textAlign = 'right';
  valueEl.style.fontSize = '13px';
  valueEl.style.color = '#555';

  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    valueEl.textContent = format(v);
    onChange(v);
  });

  wrapper.appendChild(labelEl);
  wrapper.appendChild(slider);
  wrapper.appendChild(valueEl);
  container.appendChild(wrapper);

  return slider;
}

export function createCheckbox(container: HTMLElement, label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLInputElement {
  const wrapper = document.createElement('label');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '8px';
  wrapper.style.marginBottom = '10px';
  wrapper.style.fontWeight = 'bold';
  wrapper.style.fontSize = '14px';
  wrapper.style.cursor = 'pointer';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));

  wrapper.appendChild(input);
  wrapper.appendChild(document.createTextNode(label));
  container.appendChild(wrapper);

  return input;
}
