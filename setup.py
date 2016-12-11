with open('./node_modules/@types/tsmonad/index.d.ts', 'r+b') as f:
    lines = [line for line in f]
    for i in range(681, 690):
        if lines[i][:2] == '//':
            continue
        lines[i] = '//' + lines[i]
    f.seek(0)
    f.write(''.join(lines))
    f.truncate()
