local p = nil
local Active = false

local function resetInputState()
    p = nil
    Active = false
end

local function Input(InputData)
    p = promise.new()
    while Active do Wait(0) end
    Active = true

    SendNUIMessage({
        action = "input",
        data = InputData
    })
    SetNuiFocus(true, true)

    local inputs = Citizen.Await(p)
    return inputs
end
exports("Input", Input)

RegisterNUICallback('input-callback', function(data, cb)
	SetNuiFocus(false, false)
    p:resolve(data.input)
    resetInputState()
    cb('ok')
end)

RegisterNUICallback('input-close', function(data, cb)
    SetNuiFocus(false, false)
    p:resolve(nil)
    resetInputState()
    cb('ok')
end)
