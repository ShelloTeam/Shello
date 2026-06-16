import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.core.llm.base import LLMProvider
from app.core.llm.openai_provider import OpenAIProvider
from app.core.llm.exceptions import LLMProviderError


def test_llm_provider_is_abstract():
    with pytest.raises(TypeError):
        LLMProvider()


def test_openai_provider_implements_interface():
    provider = OpenAIProvider(api_key="test-key")
    assert isinstance(provider, LLMProvider)


def test_openai_provider_uses_fixed_model():
    provider = OpenAIProvider(api_key="test-key")
    assert provider.MODEL == "gpt-4o-mini-2024-07-18"


def test_openai_provider_uses_fixed_temperature():
    provider = OpenAIProvider(api_key="test-key")
    assert provider.TEMPERATURE == 0.7


@pytest.mark.asyncio
async def test_openai_provider_generate_calls_correct_model():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="resposta"))]
    mock_response.usage = MagicMock(prompt_tokens=10, completion_tokens=5)
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    provider = OpenAIProvider(api_key="test-key")
    provider._client = mock_client

    await provider.generate(system_prompt="sys", history=[], user_message="oi")

    call_kwargs = mock_client.chat.completions.create.call_args.kwargs
    assert call_kwargs["model"] == "gpt-4o-mini-2024-07-18"


@pytest.mark.asyncio
async def test_openai_provider_generate_uses_fixed_temperature():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="resposta"))]
    mock_response.usage = MagicMock(prompt_tokens=10, completion_tokens=5)
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    provider = OpenAIProvider(api_key="test-key")
    provider._client = mock_client

    await provider.generate(system_prompt="sys", history=[], user_message="oi")

    call_kwargs = mock_client.chat.completions.create.call_args.kwargs
    assert call_kwargs["temperature"] == 0.7


@pytest.mark.asyncio
async def test_openai_provider_generate_returns_string():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="minha resposta"))]
    mock_response.usage = MagicMock(prompt_tokens=10, completion_tokens=5)
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    provider = OpenAIProvider(api_key="test-key")
    provider._client = mock_client

    result = await provider.generate(system_prompt="sys", history=[], user_message="oi")
    assert result == "minha resposta"


@pytest.mark.asyncio
async def test_moderate_returns_true_when_content_safe():
    mock_client = MagicMock()
    mock_result = MagicMock()
    mock_result.results = [MagicMock(flagged=False)]
    mock_client.moderations.create = AsyncMock(return_value=mock_result)

    provider = OpenAIProvider(api_key="test-key")
    provider._client = mock_client

    result = await provider.moderate("texto seguro")
    assert result is True


@pytest.mark.asyncio
async def test_moderate_returns_false_when_content_flagged():
    mock_client = MagicMock()
    mock_result = MagicMock()
    mock_result.results = [MagicMock(flagged=True)]
    mock_client.moderations.create = AsyncMock(return_value=mock_result)

    provider = OpenAIProvider(api_key="test-key")
    provider._client = mock_client

    result = await provider.moderate("texto problemático")
    assert result is False


@pytest.mark.asyncio
async def test_generate_raises_llm_provider_error_on_api_failure():
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=Exception("API down"))

    provider = OpenAIProvider(api_key="test-key")
    provider._client = mock_client

    with pytest.raises(LLMProviderError):
        await provider.generate(system_prompt="sys", history=[], user_message="oi")


@pytest.mark.asyncio
async def test_moderate_raises_llm_provider_error_on_api_failure():
    mock_client = MagicMock()
    mock_client.moderations.create = AsyncMock(side_effect=Exception("API down"))

    provider = OpenAIProvider(api_key="test-key")
    provider._client = mock_client

    with pytest.raises(LLMProviderError):
        await provider.moderate("texto")
