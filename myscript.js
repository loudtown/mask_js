////////////////////////////////////////////////////////
//-----------------------------------------------------
// COMMENTARY
//-----------------------------------------------------
/*
Маска e-mail отключена, т.к. из неё можно было бы брать только разделители (они ведь могут быть самыми разными),
в таком случае количество частей можно было бы получить из маски и отдельного поля не требовалось бы, а оно является 
обязательным.
Валидация также самая примитивная, ибо не все возможные валидные случае проверяются регулярным выражением
(http://www.ex-parrot.com/~pdw/Mail-RFC822-Address.html)


Вводимые маски для остальных типов интерпретируются следующим образом:
любая цифра может быть любой цифрой. Несколько цифр подряд заменяются любым числом
если флаг enforceDigitNum в начале кода установлен в значение true -
 тогда учитывается и количество цифр (разрядов) в числах.

Маска телефона пропускает практически всё, где есть цифры, ибо, как выяснилось, форматы записи телефонов могут быть очень
разными: http://stackoverflow.com/questions/123559/a-comprehensive-regex-for-phone-number-validation
Не исключено, что тому, кто будет указывать свою маску, захочется написать и "123 код (123) 1343125"
Единственное, что объединяет форматы записей телефонных номеров - наличие, собственно, номера
Поэтому из вводимой строки будут браться только цифры, и на соответствующие места будут подставляться разделители из маски 

Маска числа в экспоненциальной форме и числа позволяют учитывать знак числа (эксп.форма - знак степени тоже),
 если установлен флаг enforceSign. Помимо этого, из маски берётся разделитель, подставляющийся во введённую
 строку вместо какого-либо изначального разделителя. 
*/
//-----------------------------------------------------
////////////////////////////////////////////////////////
$(function(){
    
    //кол-во добавленных контролов
    var _addedIndex = 0;
    
    //можно установить в true, если нужно, чтобы строго учитывался знак чисел, прописанный в маске
    var enforceSign = true;
    
    //можно установить в true, если нужно, чтобы строго учитывалось количество цифр(разрядов) в числах
    var enforceDigitNum = true;
    
    //показ элементов первой части при переключении типа
    $('#selectType').change(function(){
        $('#maskInputContainer').removeClass('hidden');
        $('#btnAdd').removeClass('hidden');
        if($('#selectType option:selected').attr('value') == 'emailType'){
            $('#partsInputContainer').removeClass('hidden');
            $('#tbMask').val('qwerty@qwerty');
            $('#tbMask').attr('disabled','');
        }
        else{
            $('#partsInputContainer').addClass('hidden');
            $('#tbMask').val('');
            $('#tbMask').removeAttr('disabled');
        }
    });
    
    //добавление контролов во вторую часть
    $('#btnAdd').click(function(){
        //проверка маски
        if(!validateMask()){
            $('#maskInputContainer').addClass('has-error');
            $('#tbMaskHelpSpan').text('Неверное значение маски для выбранного типа');
            return false;
        }
        
        //проверка кол-ва частей
        if($('#selectType option:selected').attr('value') == 'emailType' && parseInt($('#tbPartsCount').val()) < 2 || isNaN(parseInt($('#tbPartsCount').val()))){
            $('#partsInputContainer').addClass('has-error'); 
            $('#tbPartsHelpSpan').text('>1 !');
            return false;
        }
        
        //показ формы второй части
        $('#formElements').removeClass('hidden');
        
        //создание и добавление контролов для ряда
        var container = '<div class="row with-margin" id="addedElementContainer' + _addedIndex + '"></div>';
        $('#formElements').append(container);
        var addedTbId = 'addedTb' + _addedIndex;
        var label = '<label class="control-label col-sm-3" for="' + addedTbId + '">' + $('#selectType option:selected').text() + ': </label>';
        var textbox = '<input type="text" class="form-control col-sm-4" id="' + addedTbId + '" />';
        var okButton = '<button type="button" class="btn btn-primary col-sm-1 with-left-margin" id="addedOkBtn' + _addedIndex + '">OK</button>';
        var result = '<span class="control-label col-sm-3" for="' + addedTbId + '" id="result' + _addedIndex + '"></label>';
        var rmButton = '<button type="button" class="btn btn-danger col-sm-1 pull-right" id="addedRemoveBtn' + _addedIndex + '">&#10006;</button>';
        $('#addedElementContainer' + _addedIndex).append(label, textbox, okButton, result, rmButton);
        
        //запись данных о маске в созданный контрол
        $('#' + addedTbId).data('typeData', $('#selectType option:selected').attr('value'));
        $('#' + addedTbId).data('maskData', $('#tbMask').val());
        $('#' + addedTbId).data('partsCountData', $('#tbPartsCount').val()); 
        
        //инкремент количества добавленных рядов
        ++_addedIndex;
    });
    
    //удаление ряда
    $('#formElements').on('click', 'button[id^="addedRemoveBtn"]', function(){
        //если это последний ряд - можно скрыть всю вторую часть
        if($('#formElements').children('div[id^="addedElement"]').length == 1)
            $('#formElements').addClass('hidden');    
        $(this).parent('div[id*="Container"]').remove();
    });
    
    //обработка введенных данных с учетом маски
    function parsedText(caller){
        
        var tb = caller.parent().find('input[id^="addedTb"]');
        var result = '';
        var mask = tb.data('maskData');
        var maskParts;
        var parts;
        var idx;
        var numIdx;
        
        switch(tb.data('typeData')){
            
            case 'emailType':
                parts = tb.val().trim().split(/\s+/);
                maskParts = mask.trim().split(/[\s\.\,\@]/);
                //if(maskParts.length !== parts.length)
                if(parts.length != tb.data('partsCountData'))
                    return 'Введённый текст не соответствует маске по кол-ву частей';
                
                //при кол-ве частей больше 1, [at] будет добавляться перед последними вторыми
                //иначе - перед последней
                //numIdx используется, чтоб не создавать новую переменную
                numIdx = parts.length > 2 ? parts.length - 2 : parts.length - 1;
                for(idx = 0; idx < numIdx; idx++) 
                    result += parts[idx] + '.';
                //удалить последнюю точку...
                result = result.slice(0, -1);
                //чтобы поставить вместо неё [at]
                result += '@';
                for(; idx < parts.length; idx++) 
                    result += parts[idx] + '.';
                //удалить последнюю точку
                result = result.slice(0, - 1);
                break;
                
            case 'telephoneType':
                //удалить все не_цифры
                result = tb.val().replace(/\D/g, '');
                //получить количество цифр в маске...
                var len = mask.replace(/\D/g, '').length;
                //...чтобы сравнить с введённым
                if(result.length !== len){
                    result = (result.length < len ? 'Недостаточное' : 'Слишком большое') + ' кол-во цифр';
                    caller.parent('div[id*="Container"]').addClass('has-error');
                    break;
                }
                //idx считает символы маски, numIdx - пройденные цифры - куда во введённой строке вставлять разделители
                for(idx = 0, numIdx = 0; idx < mask.length; idx++)
                    if(!isNaN(mask[idx])) numIdx++;
                    else result = insert(result, numIdx++, mask[idx]);
                break;
                
            case 'scientificType':
                if(!/^[-+]?[0-9]*[\.\,\s\_]?[0-9]+([eE\s\.\,\_][-+]?[0-9]+)/.test(tb.val()))
                    return 'Введённый текст не соответствует маске';
                
                maskParts = mask.trim().split(/[\.\,\s\_Ee]/, 3);
                parts = tb.val().trim().split(/[\.\,\s\_Ee]/, 3);
                if(maskParts.length !== parts.length)
                    return 'Введённый текст не соответствует маске по кол-ву частей';
                
                //если нужно учитывать знак первой и последней (степенной) частей
                if(enforceSign)
                    if(((/^[\d\+]/.test(maskParts[0]) && !(/^[\d\+]/.test(parts[0]))) || (maskParts[0].startsWith('-') && !parts[0].startsWith('-'))) || 
                    ((/^[\d\+]/.test(maskParts[maskParts.length - 1]) && !(/^[\d\+]/.test(parts[parts.length - 1]))) || (maskParts[maskParts.length - 1].startsWith('-') && !parts[parts.length - 1].startsWith('-'))))
                        return 'Введённый текст не соответствует маске по знаку';
                
                //если нужно учитывать количество разрядов
                if(enforceDigitNum)
                    for(idx = 0; idx < parts.length; idx++)
                        if(maskParts[idx].match(/\d/).length !== parts[idx].match(/\d/).length)
                            return 'Введённый текст не соответствует маске по количеству нужных разрядов';
                            
                //numIdx просто чтобы не создавать новую переменную. 
                //idx считает части, numIdx - индексы символов разделителей.
                for(idx = 0, numIdx = 0; idx < parts.length; idx++){
                    numIdx += maskParts[idx].length;
                    result += parts[idx];
                    if(idx !== parts.length - 1) result += mask[numIdx + idx];
                }
                break;
            case 'numbersType':
                if(!/^[-+]?[0-9]*[\.\,\s\_\]?[0-9]*$/.test(tb.val()))
                    return 'Введённый текст не соответствует маске';
                //получить десятичный разделитель из маски, если он есть
                var separator = mask.indexOf('.') == -1 ? mask.indexOf(',') == -1 ? '' : ',' : '.';
                parts = tb.val().trim().split(/[\.\,\s\_]+/,2);
                maskParts = mask.trim().split(separator, 2);
                //если введено частей две, а разделителя нет, или разделитель есть, а введено меньше\больше частей
                if((!isBlank(separator) && parts.length !== 2) || (isBlank(separator) && parts.length == 2))
                    return 'Введённый текст не соответствует маске по кол-ву частей';
                    
                //если нужно учитывать знак
                if(enforceSign)
                    if((/^[\d\+]/.test(mask) && !(/^[\d\+]/.test(parts[0]))) || (mask.startsWith('-') && !parts[0].startsWith('-')))
                        return 'Введённый текст не соответствует маске по знаку';
                //если нужно учитывать количество разрядов
                if(enforceDigitNum)
                    for(idx = 0; idx < parts.length; idx++)
                        if(maskParts[idx].match(/\d/).length !== parts[idx].match(/\d/).length)
                            return 'Введённый текст не соответствует маске по количеству нужных разрядов';
                           
                result = parts[0];
                if(parts.length == 2) result += separator + parts[1];
                break;
        }
        return result;
    }

    //кнопка ОК
    $('#formElements').on('click', 'button[id^="addedOkBtn"]', function(){
        $(this).parent().find('span[id^="result"]').text(parsedText($(this)));
    });
    
    //проверка вводимой маски при добавлении контрола regexp общего вида
    function validateMask(){
        var val = $('#tbMask').val();
        switch($('#selectType option:selected').attr('value')){
            case 'emailType':
                return /.*\@.*/.test(val);
            case 'telephoneType':
                return /.*[0-9].*/.test(val);
            case 'scientificType':
                return /^[-+]?[0-9]*[\.\,]?[0-9]+([eE][-+]?[0-9]+)/.test(val);     
            case 'numbersType':
                return /^[-+]?[0-9]+[\.\,]?[0-9]*$/.test(val);
        }
    }

    //сбросить состояние ошибки при начале редактирования инпута
    $('#formElements').on('keyup', 'input[id^="addedTb"]', function(){
        $(this).parent('div[id*="Container"]').removeClass('has-error');
        $(this).parent('div[id*="Container"]').removeClass('has-warning');
        $(this).parent().find('span[id^="result"]').text('');
    });
    
    //сбросить состояние ошибки с инпута маски при начале его редактирования
    $('#tbMask').focus(function(){
       $('#maskInputContainer').removeClass('has-error'); 
       $('#tbMaskHelpSpan').text('');
    });
    
    //сбросить состояние ошибки с инпута кол-ва частей при начале его редактирования
    $('#tbPartsCount').focus(function(){
       $('#partsInputContainer').removeClass('has-error'); 
       $('#tbPartsHelpSpan').text('');
    });
    
    // вставка внутрь строки
    function insert(str, index, value) {
        return str.substr(0, index) + value + str.substr(index);
    }
    
    //проверка на пустоту
    function isBlank(str) {
        return (!str || /^\s*$/.test(str));
    }
    
});

////////////////////////////////////////////////////////
//-----------------------------------------------------
// old ideas - СТАРЫЕ ИДЕИ
//-----------------------------------------------------

//проверка на keyup во время ввода. Предупреждение при малейшем отклонении от маски (не поставть скобку в телефоне). 
//только предупреждение потому, что скобку потом можно подставить при нажатии ОК, как и сделано
        // var regexpMask = new RegExp(regexpMaskString.substr(0, 1 + 2 * $(this).val().length) + '$');   
        // var regexpLooseMask = new RegExp(regexpLooseMaskString.substr(0, 1 + 3 * $(this).val().length));// without a '$', 'g');   
        // 
        // if(!regexpMask.test($(this).val(),''))
        //     if(regexpLooseMask.test($(this).val()))
        //         $(this).parent('div[id*="Container"]').addClass('has-warning');
        //     else
        //         $(this).parent('div[id*="Container"]').addClass('has-error');
        //          
        // regexpMask = null;
        // regexpLooseMask = null;
        
        
// создание строгих масок при фокусе (ибо во время фокуса меняется текущая маска) для использования в куске выше. 
            // $('#formElements').on('focus','input[id^="addedTb"]', function(){
    //     switch($(this).data('typeData')){
    //         case 'emailType':
    //             break;
    //         case 'telephoneType':
    //             regexpMaskString = "^";
    //             regexpLooseMaskString = "^";
    //             var mask = $(this).data('maskData'); // closest?
    //             for(var i = 0; i < mask.length; i++){
    //                 regexpMaskString += /\d/.test(mask[i]) ? '\\d' : '\\' + mask[i]; 
    //                 regexpLooseMaskString += /\d/.test(mask[i]) ? '\\d?' : '\\s?';
    //             }
    //             break;
    //         case 'scientificType':
    //             regexpMaskString = "^";
    //             regexpLooseMaskString = "^";
    //             var mask = $(this).data('maskData'); // closest?
    //             for(var i = 0; i < mask.length; i++){
    //                 regexpMaskString += /\d/.test(mask[i]) ? '\\d' : /[Ee]/.test(mask[i]) ? '\\e' : '\\' + mask[i]; 
    //                 regexpLooseMaskString += /\d/.test(mask[i]) ? '\\d?' : '\\s?';
    //             }
    //             break;
    //         case 'numbersType':
    //             break;
    //     }
    // });